======================
HVA Local Installation
======================

This guide describes the working WSL2, Docker, and local Django setup for this
project. Run the commands from the repository root.

Prerequisites
=============

Use VS Code with the WSL/Ubuntu remote extension. In Docker Desktop, enable
Ubuntu under ``Settings > Resources > WSL Integration``.

Install the system packages required by ``pygraphviz``:

.. code-block:: bash

    sudo apt update
    sudo apt install graphviz libgraphviz-dev

Python dependencies
===================

Create and activate the virtual environment, then install the development
dependencies:

.. code-block:: bash

    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install --upgrade pip
    pip install -r requirements/dev.txt

If ``pygraphviz`` fails with ``graphviz/cgraph.h: No such file or directory``,
install ``libgraphviz-dev`` as shown above and rerun the pip command.

Node.js and frontend assets
===========================

The project pins Node.js 24 in ``.nvmrc``. Install Linux Node.js inside WSL;
do not use the Windows ``npm.cmd`` from a WSL directory.

.. code-block:: bash

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    source ~/.bashrc
    nvm install 24
    nvm use 24
    node --version
    npm --version
    npm ci
    npm run build

Environment
===========

Create the local environment file. The values in ``dotenv.example`` connect
host-side Django commands to the PostgreSQL container exposed on port 5432.

.. code-block:: bash

    cp dotenv.example .env

Do not commit ``.env``. It contains local development settings.

Start Docker services
=====================

Start PostgreSQL, Redis, the web application, and the background workers:

.. code-block:: bash
    docker-compose up -d --no-build
    docker-compose exec web src/manage.py loaddata klantinteracties contactgegevens
    docker-compose exec web src/manage.py createsuperuser

The application is available at http://localhost:8000/ and Flower is available
at http://localhost:5555/.

The ``web-init`` service applies migrations and runs the setup configuration.
For a Docker-only command, migrations can also be run with:

Other Options:

.. code-block:: bash

    docker compose up -d
    docker compose ps

.. code-block:: bash

    docker compose exec web /app/src/manage.py migrate

Host-side Django commands
=========================

With the virtual environment activated, these commands use the Docker database
through the values in ``.env``:

.. code-block:: bash

    python src/manage.py check
    python src/manage.py migrate
    python src/manage.py collectstatic --link --noinput
    python src/manage.py createsuperuser
    python src/manage.py runserver 8001

The Docker web service already uses port 8000. Use port 8001 for the host-side
development server, or stop the Docker web service before using port 8000:

.. code-block:: bash

    docker compose stop web
    python src/manage.py runserver

Existing database migration repair
==================================

If ``docker compose up -d`` fails in ``web-init`` with a duplicate UUID error
for migration ``0049_internetaken_actoren_verbose_name``, the persistent
development database was created before that migration. Back up the database
first, then run the following repair. It preserves existing rows and should
only be used when the reported migration and constraint names match.

Where docker compose exec tells docker to run a command inside an already running container defined the docker-compose.yml file. 
The -T option disables pseudo-tty allocation, which is useful for non-interactive commands. 
The psql command connects to the PostgreSQL database and executes the SQL commands provided in the heredoc (<<'SQL' ... SQL). 
The BEGIN and COMMIT statements ensure that all the changes are made in a single transaction, so if any part fails, none of the changes will be applied.

.. code-block:: bash

    docker compose exec -T db psql -v ON_ERROR_STOP=1 -U postgres -d openklant <<'SQL'
    BEGIN;
    ALTER TABLE klantinteracties_organisatie ADD COLUMN uuid uuid DEFAULT gen_random_uuid() NOT NULL;
    ALTER TABLE klantinteracties_organisatie ALTER COLUMN uuid DROP DEFAULT;
    ALTER TABLE klantinteracties_organisatie ADD CONSTRAINT klantinteracties_organisatie_uuid_key UNIQUE (uuid);
    ALTER TABLE klantinteracties_persoon ADD COLUMN uuid uuid DEFAULT gen_random_uuid() NOT NULL;
    ALTER TABLE klantinteracties_persoon ALTER COLUMN uuid DROP DEFAULT;
    ALTER TABLE klantinteracties_persoon ADD CONSTRAINT klantinteracties_persoon_uuid_key UNIQUE (uuid);
    ALTER TABLE klantinteracties_internetakenactorenthoughmodel ADD COLUMN uuid uuid DEFAULT gen_random_uuid() NOT NULL;
    ALTER TABLE klantinteracties_internetakenactorenthoughmodel ALTER COLUMN uuid DROP DEFAULT;
    ALTER TABLE klantinteracties_internetakenactorenthoughmodel ADD CONSTRAINT klantinteracties_internetakenactorenthoughmodel_uuid_key UNIQUE (uuid);
    COMMIT;
    SQL

    docker compose run --rm --no-deps --entrypoint sh web -c \
        "python /app/src/manage.py migrate klantinteracties 0049 --fake"
    docker compose up -d

Changes made for this setup
===========================

* ``docker-compose.yml`` publishes PostgreSQL on ``127.0.0.1:5432`` so local
  Django commands can connect to the Docker database.
* ``dotenv.example`` contains the matching development database settings.
* ``src/openklant/cloud_events/__init__.py`` marks ``cloud_events`` as a Python
  package, keeping Django system checks clean.

Stopping services
=================

Stop the services while keeping the database volume:

.. code-block:: bash

    docker compose down

To remove the database volume as well, use ``docker compose down -v`` only if
you intentionally want to discard all local database data.