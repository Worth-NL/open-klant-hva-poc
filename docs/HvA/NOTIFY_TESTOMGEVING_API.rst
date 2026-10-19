============
HVA CURL API
============

Curl api's for openklant, notifynl and openzaak.

Prerequisites
=============
Within src create a folder called test_omgeving_api and create a token_gen.py and curl_api.sh file. 
Make sure to give the file execution rights with chmod +x curl_api.sh.

.. code-block:: bash

    mkdir src/test_omgeving_api
    touch src/test_omgeving_api/token_gen.py
    touch src/test_omgeving_api/curl_api.sh

Inside the .venv activate the virtual environment and install the pyjwt library:
.. code-block:: bash

    source .venv/bin/activate
    pip install pyjwt

Within the token_gen.py file, add the following code to generate a JWT token (ps. the CLIENT_ID and SECRET should be replaced with your own values given by Frank through Slack):
.. code-block:: python
    import time, jwt

    CLIENT_ID = "hva-voornaam-achternaam"
    SECRET = "jouw-secret"

    token = jwt.encode({
        "iss": CLIENT_ID,
        "client_id": CLIENT_ID,
        "iat": int(time.time()),
        "user_id": CLIENT_ID,
        "user_representation": CLIENT_ID,
    }, SECRET, algorithm="HS256")
    print(token)

Copy the generated token and paste it into the .env file.

Inside the curl_api.sh file, add the following code to make API requests to openklant, notifynl and openzaak:

.. codee-block:: bash
    #!/bin/bash

    curl https://openzaak.test.notifynl.nl/zaken/api/v1/zaken -H "Authorization: Bearer <token>" -H "Accept-Crs: EPSG:4326"
    curl https://opennotificaties.test.notifynl.nl/api/v1/kanaal -H "Authorization: Bearer <token>"
    curl https://openklantv2.test.notifynl.nl/klantinteracties/api/v1/partijen -H "Authorization: Token <token>"

    # Export results to a file
    echo "Curl results" > api_result.json

The <token> should be replaced with the JWT token generated in the previous step.

Give excution rights to the curl_api.sh file:
.. code-block:: bash

    chmod +x src/test_omgeving_api/curl_api.sh

And run the curl_api.sh file to make the API requests:
.. code-block:: bash
    ./src/test_omgeving_api/curl_api.sh