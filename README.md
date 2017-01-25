simplytranslate
===============

Simple translation app built as an assignment for Plivo.

Before testing, create a Google Cloud account, and enable the Speech and Translation services. Billing *must* be enabled.

Then, create an API key, and a service account. Download the service account configuration JSON and store it in this directory as `credentials.json`.

Install dependencies by running `yarn`. Then, to run, do:
    
    PORT=port GPROJECT_ID=project_id GAPI_KEY=api_key yarn run dev

To run tests, do:

    yarn test
