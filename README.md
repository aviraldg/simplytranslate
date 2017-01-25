simplytranslate
===============

Simple translation app built as an assignment for Plivo.

Before testing, create a Google Cloud account, and enable the Speech and Translation services. Billing *must* be enabled.

Then, create an API key, and a service account. Download the service account configuration JSON and store it in this directory as `credentials.json`.

Install dependencies by running `yarn`. Then, to run, do:
    
    PORT=port GPROJECT_ID=project_id GAPI_KEY=api_key yarn run dev

To run tests, do:

    yarn test

What Works
---

1. Recording audio (on Chrome at the very least)
2. Transcribing audio
3. Translating transcribed audio (Chinese does not work, but it's trivial to fix) to English
4. Viewing history
5. Responsive, so it works well and looks good on Android too.

Possible Improvements
---

1. Streaming responses to our own server and to the Google Cloud Speech API
2. API response pagination
3. Setting up webpack for optimizing and building version suitable for deployment.
4. Better browser compatibility
