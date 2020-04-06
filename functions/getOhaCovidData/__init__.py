import datetime
import logging
import re
import os
from io import BytesIO

import azure.functions as func
from azure.storage.blob import BlobServiceClient

import requests
import lxml.html as lh
from lxml import etree as et
import pandas as pd


OHA_URL = "https://govstatus.egov.com/OR-OHA-COVID-19"
DATE_PATTERN = "(\d{1,2}[\/]\d{1,2}[\/]\d{4})"
BLOB_NAME = "data/or-covid-timeseries.csv"

def main(mytimer: func.TimerRequest) -> None:
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    logging.info('Python timer trigger function ran at %s', utc_timestamp)

    # Retrieve the existing set of date (used to check for the last pulled date and overwrite the file)
    storage_account_string = os.environ["AzureWebJobsStorage"]
    blob_service_client = BlobServiceClient.from_connection_string(storage_account_string)
    container_client = blob_service_client.get_container_client("$web")
    blob_client = container_client.get_blob_client(BLOB_NAME)
    blob_string = blob_client.download_blob().readall()
    covid_df = pd.read_csv(BytesIO(blob_string), dtype={
        "Positives": int,
        "Deaths": int,
        "Negatives": "Int64"
    })

    # Get the max date 
    covid_df["Date2"] = pd.to_datetime(covid_df["Date"], format="%m/%d/%y")

    max_date = covid_df["Date2"].max()
    logging.info(f"Max date in BLOB: {max_date}")
    logging.info(covid_df)

    # Request the HTML from the OHA Covid 19 web page
    r = requests.get(OHA_URL)

    # If status is OK, process the data...
    if r.status_code == 200:

        doc = lh.fromstring(r.text)
        # First, find the last updated date
        date_element = doc.xpath("//*[@id=\"collapseCases\"]/div/table/thead/tr/th/text()")
        date_text = date_element[0]
        date_match = re.search(DATE_PATTERN, date_text)
        if date_match:            oha_date = datetime.datetime.strptime(date_match.group(1), "%m/%d/%Y")

        # Check if data is greater than the latest date in the file 
        # If date > then parse the HTML table of counties
        if oha_date > max_date:
            table_element = doc.xpath("//*[@id=\"collapseOne\"]/div/table[1]")[0]
            oha_table = pd.read_html(et.tostring(table_element))[0]

            #logging.info(oha_table[0])
            oha_table = oha_table[oha_table["County"] != "Total"]

            rename = {
                oha_table.columns[1]: "Positives", # Using the index as Positives has a funky character that isn't recognized
                "Deaths*": "Deaths",
                "Negative": "Negatives"
            }
            # Clean up the column names
            oha_table = oha_table.rename(columns=rename)


            # Print the date
            oha_table["Date"] = datetime.datetime.strftime(oha_date, "%m/%d/%y")

            # Combine the two dataframes
            covid_df = pd.concat([covid_df, oha_table])

            # Upload the new dataframe covid_df.to_string(index=False)
            output = covid_df.to_csv(index=False)
            blob_client.upload_blob(output, overwrite=True)
        else: 
            logging.info("Data already up to date")
