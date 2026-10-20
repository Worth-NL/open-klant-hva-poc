# Plan van aanpak: communicatievoorkeur per zaak (route C, in OpenKlant)

**Doel in één zin:** een inwoner ziet zijn zaken en kiest per zaak via welk communicatiemiddel (e-mail, sms, Berichtenbox, brief) hij geïnformeerd wil worden; de keuzes zijn beperkt tot wat de gemeente voor dat soort zaak toestaat, en het OMC kan per zaak opvragen welk kanaal gebruikt moet worden.

**Uitgangspunt:** we bouwen verder op OpenKlant (route C). We gebruiken de MoZa Profielservice **niet**: geen koppeling en geen nabouw van hun API of architectuur. Alle voorkeuren, kanalen en adressen leven in OpenKlant, dat al `Partij` en `DigitaalAdres` heeft.

Dit plan vertaalt `docs/HvA/OPDRACHT.md` (WORTH × Public Lab) naar werk in deze repo. Het begint bij **het scherm voor de inwoner** en werkt van daaruit naar de data en de API. Spoor 1 (bouwen) staat centraal; spoor 2 (onderzoek & ontwerp) krijgt in [§7](#7-spoor-2-onderzoek--ontwerp) de aanknopingspunten.

Leesvolgorde: [1. Het scherm](#1-het-scherm-waar-het-om-draait) · [2. Hoe het werkt](#2-hoe-het-werkt-van-scherm-tot-omc) · [3. Wat bestaat al](#3-wat-openklant-al-heeft) · [4. Ontwerp](#4-ontwerp) · [5. Bestanden](#5-bestandsarchitectuur) · [6. Stappenplan](#6-stappenplan-waar-begin-je) · [7. Spoor 2](#7-spoor-2-onderzoek--ontwerp) · [8. Opleveringen](#8-opleveringen-en-definition-of-done) · [9. Risico's](#9-risicos-en-keuzes-die-je-moet-onderbouwen) · [Bijlage A: API-specs](#bijlage-a-api-specs-van-de-testomgeving)

---

## 1. Het scherm waar het om draait

De inwoner (hier: "Anna") ziet twee dingen: hoe ze standaard bericht krijgt per soort zaak, en een lijst van haar zaken met per zaak een keuzelijst.

```
Mijn communicatievoorkeuren                                   Ingelogd als Anna  [TESTLOGIN]
───────────────────────────────────────────────────────────────────────────────────────────
Mijn zaken - hoe wil ik geïnformeerd worden?

Zaak                                  Status             Informeer mij via
───────────────────────────────────────────────────────────────────────────────────────────
Kapvergunning Dorpsstraat 3           In behandeling     [ Berichtenbox ▼ ]   ← afwijkend
Kapvergunning Kerklaan 12             Afgerond           [ Standaard (e-mail) ▼ ]
Parkeervergunning 2026-0042           Aangevraagd        [ Standaard (sms) ▼ ]
   keuzes per zaak: alleen kanalen die de gemeente voor dit soort zaak toestaat

Standaard per soort zaak (geldt ook voor nieuwe zaken)
───────────────────────────────────────────────────────────────────────────────────────────
Kapvergunning        [ E-mail ▼ ]    (toegestaan: e-mail, Berichtenbox)
Parkeervergunning    [ Sms ▼ ]       (toegestaan: e-mail, sms)

Mijn contactgegevens                                                    [ + toevoegen ]
───────────────────────────────────────────────────────────────────────────────────────────
E-mail   anna@example.nl        ✔ geverifieerd
E-mail   anna.werk@example.nl   ✖ niet geverifieerd      [ verifieer ]
Sms      06 12345678            ✔ geverifieerd
Brief    Dorpsstraat 3, Amsterdam (uit mijn gegevens)

[ Opslaan ]                       "Voor sms is een geverifieerd telefoonnummer nodig."
```

Waarom **ook** een standaard per soort zaak? Het eerste bericht over een nieuwe zaak ("zaak aangemaakt") gaat de deur uit op het moment dat de zaak ontstaat, vóórdat de inwoner er iets over kon kiezen. Zonder standaard per soort zaak kent het OMC op dat moment geen voorkeur. De voorkeur per zaak is een **uitzondering** daarop.

Toestanden die ontworpen moeten worden: geen zaken, Open Zaak niet bereikbaar, geen toegestaan kanaal voor dit soort zaak, kanaal gekozen zonder geverifieerd adres, opslaan gelukt/mislukt (met `aria-live`-melding).

## 2. Hoe het werkt, van scherm tot OMC

```
Inwoner (browser)
   │  HTML-formulier (werkt ook zonder JavaScript)
   ▼
Portal-pagina in OpenKlant (Django, serverside)  ──► Open Zaak:  welke zaken heeft deze burger?   (servertoken, nooit in de browser)
   │                                              ──► OpenKlant-DB: toegestane kanalen, adressen, voorkeuren
   │  opslaan
   ▼
Communicatievoorkeur (OpenKlant)

OMC bij een event over zaak Z van burger B:
   GET /klantinteracties/api/v1/voorkeurskanaal?zaak=Z&zaaktypeIdentificatie=<identificatie>&partijIdentificator__objectId=B ...  (volledig in §4.3)
        ──► "berichtenbox" (bron: zaak)  of  "email" (bron: zaaktype-standaard)  of  bron: geen
   ──► NotifyNL verstuurt via dat kanaal
```

Vier beslissingen volgen hieruit:

1. **De pagina draait serverside.** Zowel Open Zaak (JWT-secret) als OpenKlant (`Token`) hebben geheimen. Een losse React/Vue-app in de browser kan daar niet direct bij; je hebt dus sowieso een serverlaag nodig. In deze repo is dat het meest eenvoudig een Django-view (zie [4.5](#45-waarom-geen-spa)).
2. **De zaken komen uit Open Zaak, niet uit OpenKlant.** OpenKlant kent zaken niet; het kent alleen verwijzingen (`Onderwerpobject` met `codeObjecttype="zaak"`). Er komt dus een kleine client naar Open Zaak.
3. **Een "soort zaak" = zaaktype.** De gemeente beheert per zaaktype welke kanalen toegestaan zijn. Het OMC werkt al met zaaktype-identificaties (whitelists), dus heet het model in OpenKlant `Zaaktype` en is `Zaaktype.identificatie` gelijk aan de zaaktype-**identificatie** uit Open Zaak. Daarmee is de eerdere open vraag "hoe koppelt het OMC een event aan de juiste instelling" opgelost. (In `OPDRACHT.md` heet dit "scope"; in code, API en dit plan gebruiken we de duidelijkere naam `Zaaktype`.)
4. **Twee niveaus van voorkeur**: standaard per soort zaak (zaaktype) en uitzondering per zaak. Het OMC lost op in die volgorde: zaak → zaaktype-standaard → geen (het OMC houdt dan zijn eigen volgorde).

## 3. Wat OpenKlant al heeft

Gecontroleerd in de code (`src/openklant/components/klantinteracties/`):

| Nodig voor het scherm | Bestaat al? | Hergebruik |
|---|---|---|
| Burger | Ja | `Partij` + `PartijIdentificator` (`bsn`); zoeken via `partijIdentificator__*` |
| Meerdere e-mailadressen/telefoonnummers | Ja | `DigitaalAdres` (`email`, `telefoonnummer`, `overig`) |
| Geverifieerd | Deels | `DigitaalAdres.verificatie_datum` + API-filter `isGeverifieerd`; de verificatie-uitvoering via NotifyNL niet |
| Postadres voor brief | Ja | `Partij.correspondentieadres_*` |
| Verwijzing naar een zaak | Patroon | `Onderwerpobject` verwijst via `onderwerpobjectidentificator` (`codeObjecttype="zaak"`, `codeSoortObjectId="uuid"`, `objectId`) naar een zaak zonder FK; dit patroon volg je |
| Zaken van de burger opvragen | **Nee** | Nieuwe client naar Open Zaak (`zgw_consumers` is al een dependency, `Service`-configuratie bestaat) |
| Zaaktypen met toegestane kanalen, voorkeuren | **Nee** | Nieuw |
| Eén globale voorkeur | Deels | `Partij.voorkeurs_digitaal_adres`, `is_standaard_adres`: geen vervanging, wel mogelijke terugval |
| Beheerscherm gemeente | Deels | Django-admin (inlog, 2FA, OIDC) |
| Inwonerpagina | **Nee** | Geen frontend-framework in de repo; alleen admin + Django-templates + webpack (SCSS/JS) |

**Berichtenbox** is geen adres en staat niet als template-kanaal in de OMC-documentatie (daar alleen `EMAIL`, `SMS`, `LETTER`); afstemmen met Worth (open vraag 3).

## 4. Ontwerp

### 4.1 Datamodel

```
Zaaktype                  ZaaktypeKanaal                 Communicatievoorkeur
--------                  --------------                 --------------------
uuid                      uuid                           uuid
identificatie (uniek;     zaaktype (FK) ◄─────────────── zaaktype (FK)
 = zaaktype-identificatie kanaal: email|sms|             partij (FK -> Partij)
 uit Open Zaak)            berichtenbox|brief            kanaal (zelfde keuzes)
naam (voor de burger)     is_toegestaan                  zaak_uuid (UUID, null)   ← null = standaard voor het zaaktype
is_actief                 UNIQUE(zaaktype, kanaal)       digitaal_adres (FK, null) -> DigitaalAdres
                                                         UNIQUE(partij, zaaktype) waar zaak_uuid leeg is
                                                         UNIQUE(partij, zaak_uuid) waar zaak_uuid gevuld is
```

- `Zaaktype` is een **lokale registratie, geen kopie** van het zaaktype in Open Zaak: alleen de `identificatie` (de sleutel die het OMC kent), de `naam` die de inwoner leest en de toegestane kanalen. Het is **data**, zodat de gemeente er zelf een kan toevoegen. In de UI heet het "soort zaak" (of wat het gebruikersonderzoek oplevert); "zaaktype" is jargon voor de inwoner.
- `zaak_uuid` verwijst zonder FK naar de zaak in Open Zaak, naar het patroon van `Onderwerpobject`. Dat voorkomt een harde koppeling; de consequentie is dat je zelf moet omgaan met zaken die verdwijnen (open vraag 7).
- Hiërarchie is bewust weggelaten (opdracht: plat houden).

### 4.2 Validatieregels (de eigenlijke businesslogica; tests eerst)

1. Het kanaal moet voor het zaaktype `is_toegestaan` zijn.
2. `email`/`sms`: er moet een `DigitaalAdres` van **dezelfde partij** zijn met juiste soort (`email` resp. `telefoonnummer`) en `verificatie_datum` gevuld.
3. `brief`: de partij heeft een ingevuld `correspondentieadres`.
4. `berichtenbox`: geen adres nodig (afspraak Worth).
5. Bij een voorkeur per zaak: de zaak hoort bij deze partij en de zaaktype-identificatie van de zaak = `zaaktype.identificatie`. Dit controleert de portal-service bij Open Zaak, niet de modellaag. De API zelf accepteert `zaak_uuid` dus **ongecontroleerd** (aanname: alleen vertrouwde systemen met een token schrijven hier; leg dat vast in `API_BESCHRIJVING_OMC.md`). Wil je dat niet, dan moet de API-validator ook `zaken_client` aanroepen, wat de API afhankelijk maakt van Open Zaak.
6. Gemeente zet een kanaal uit: bestaande voorkeuren met dat kanaal worden bij het opvragen genegeerd (terugval) en in het scherm gemarkeerd, niet verwijderd (open vraag 5).

### 4.3 API

Onder `/klantinteracties/api/v1/`, `Authorization: Token <token>`, volgens het viewset-patroon:

| Endpoint | Doel | Gebruiker |
|---|---|---|
| `communicatievoorkeuren` (CRUD; filters `partij__uuid`, `zaaktype__identificatie`, `zaak`) | voorkeuren lezen/schrijven | portal, tests |
| **`voorkeurskanaal`** (alleen lezen) | **antwoord voor het OMC** | OMC |
| `digitaleadressen` (bestaat) | contactgegevens | portal |
| verificatie starten/bevestigen op een digitaal adres | via NotifyNL | portal |

Aanroep door het OMC (kort, één antwoord):

```
GET /klantinteracties/api/v1/voorkeurskanaal
      ?zaak=<zaak-uuid>
      &zaaktypeIdentificatie=<zaaktype-identificatie>
      &partijIdentificator__codeSoortObjectId=bsn
      &partijIdentificator__objectId=<bsn>

200 { "kanaal": "berichtenbox", "bron": "zaak",
      "digitaalAdres": null }                        # bron: "zaak" | "zaaktype" | "geen"
```

Leg vast wat bij `bron: "geen"` gebeurt (open vraag 4) en log nooit het BSN.

**Bewust geen `zaaktypen`-endpoint in het prototype.** Het beheer van zaaktypen en toegestane kanalen gaat via de admin (§4.6), de portal leest de modellen rechtstreeks en het OMC heeft alleen `voorkeurskanaal` nodig. Voeg een `zaaktypen`-endpoint pas toe als een externe client (een gemeentesysteem, of later een SPA) de toegestane kanalen moet lezen of beheren; dat zijn dan een serializer, filterset, viewset en test naar het patroon van `digitaal_adres`.

### 4.4 Zaken ophalen uit Open Zaak

Nieuwe module `src/zaken_client/` naar het patroon van `src/referentielijsten_client/` (`zgw_consumers.client.build_client`, `Service`-record voor Open Zaak met `auth_type: zgw` = JWT, ingesteld via `docker/setup_configuration/data.yaml` of de admin). De aanroepen hieronder zijn gecontroleerd tegen de OpenAPI-specs van de testomgeving (Zaken API 1.5.1, Catalogi API 1.3.1; downloadlinks in [bijlage A](#bijlage-a-api-specs-van-de-testomgeving)):

- **Zaken van een burger:** `GET /zaken/api/v1/zaken?rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn=<bsn>&expand=zaaktype,status.statustype&pageSize=100` met header `Accept-Crs: EPSG:4326` (de header staat in de spec en in `docs/HvA/NOTIFY_TESTOMGEVING_API.rst`). Authenticatie is een JWT (`Bearer`) met de gegevens die je van de begeleider krijgt. Ook bruikbaar: `rol__omschrijvingGeneriek` (bijv. `initiator`, `belanghebbende`) om te bepalen welke zaken "van" de burger zijn (open vraag 10), en `startdatum`/`einddatum__isnull` om lopende zaken te tonen. Voor veel filters is er ook `POST /zaken/_zoek`.
- **Geen N+1:** met `expand=zaaktype` komt het volledige zaaktype (met `identificatie` en `omschrijving`) mee onder `_expand.zaaktype`, en met `status.statustype` ook de huidige status. Eén call volstaat dus voor het hele scherm. Cache toch per zaaktype-URL, en verifieer de precieze nesting van `_expand` met een echt antwoord.
- **Zaaktypen vullen vanuit de Catalogi API:** `GET /catalogi/api/v1/zaaktypen?status=definitief` geeft per zaaktype `identificatie` en `omschrijving`. Meerdere versies van een zaaktype delen dezelfde `identificatie`, dus dedupliceer daarop. Dit maakt een admin-actie "zaaktypen importeren uit Catalogi" mogelijk (nuttig voor de demo); `Zaaktype.identificatie` = `identificatie`.
- **Let op:** `Zaak.communicatiekanaal` / `communicatiekanaalNaam` is het kanaal waarlangs de zaak **binnenkwam**, geen voorkeur; niet hergebruiken. `informeren` bestaat in de Catalogi API alleen op het **statustype**, niet op het zaaktype (de OMC-gitbook noemt het soms bij zaaktype): de OMC-regel "mag deze status een bericht sturen" blijft dus los van jullie voorkeuren.
- `fake.py` met fictieve zaken voor Anna, in dezelfde vorm als het echte antwoord (`url`, `uuid`, `identificatie`, `omschrijving`, `zaaktype`, `startdatum`, `einddatum`, `status`, `_expand`), zodat je zonder testomgeving kunt ontwikkelen en testen. Schakel tussen fake en echt met één instelling.

### 4.5 UI voor de gemeente

Django-admin: `Zaaktype` met inline `ZaaktypeKanaal`. Dat is een scherm met inlog en voldoet aan "via een scherm of API" (opdracht). Een eigen scherm is een verbetering voor later; het hoofdwerk zit bij de inwoner.
De UI wordt gerealiseerd vanuit het verkregen wireframe door gemeente Amsterdam. Hiervoor moet er eerst een gebruikersonderzoek verricht worden om te achterhalen welke wireframe gebruikers het meeste aantrekt.

## 5. Bestandsarchitectuur

`NIEUW` = aanmaken, `WIJZIG` = bestaand bestand aanpassen. Paden vanaf de repo-root; tussen haakjes het voorbeeld om te kopiëren.

```
com_voorkeur_portaal/                              NIEUW  Django-app voor het inwonerscherm, in de repo-root naast src/  (kern van de frontend)
├── __init__.py
├── apps.py                  ComVoorkeurPortaalConfig, name = "com_voorkeur_portaal" (app heeft geen modellen, dus geen migrations/)
├── urls.py                  app_name = "portaal" (komt in de CSS-klasse `view--portaal-<url_name>`); "voorkeuren/", "voorkeuren/zaak/<uuid>/", "contactgegevens/", "login/"(mock)
├── auth.py                  gemockte inlog: kies testpartij; alleen DEBUG; duidelijk gemarkeerd
├── views.py                 dun: ophalen via services, renderen, POST afhandelen
├── services.py              zaken + toegestane kanalen + voorkeuren samenstellen; voorkeur opslaan met validatie §4.2
├── forms.py                 formulier per zaak/zaaktype; ModelChoice beperkt tot toegestane kanalen
├── fixtures/portal_demo.json   zaaktypen (kapvergunning, parkeervergunning), toegestane kanalen, testpartij Anna met adressen
├── templates/com_voorkeur_portaal/                 (app-directory-loader vindt deze map; `master.html` komt uit src/openklant/templates)
│   ├── base.html            extends "master.html"; laadt de JS-bundel zelf in `{% block scripts %}`
│   │                        (`<script src="{% static 'bundles/openklant-js.js' %}">`): master.html laadt nu alleen de CSS-bundel
│   ├── voorkeuren.html      hoofdscherm (zaken + standaard per soort)
│   ├── _kanaalkeuze.html    herbruikbaar onderdeel: label + select + status
│   ├── contactgegevens.html lijst, toevoegen, verifiëren
│   └── login_test.html      mock-login, met zichtbare "TESTLOGIN"-banner
└── tests/                   __init__.py, test_views.py, test_services.py

Houd SCSS en JS in de bestaande webpack-pipeline onder src/openklant/ (webpack-entrypoints, `_settings.scss` en de Docker-stage `frontend-build` kijken alleen naar `src/`):

src/openklant/scss/views/_voorkeuren.scss          NIEUW  BEM-blok .voorkeuren (kleuren uit scss/_settings.scss)
src/openklant/scss/views/_index.scss               WIJZIG (nu leeg) @use "voorkeuren";
src/openklant/js/views/voorkeuren.js               NIEUW  opslaan per rij zonder herladen, aria-live melding
src/openklant/js/views/index.js                    WIJZIG (nu leeg) import './voorkeuren';
src/openklant/jstests/views/voorkeuren.spec.js     NIEUW  (Karma/Mocha)

src/zaken_client/                                  NIEUW  naar patroon van src/referentielijsten_client/
├── client.py                Open Zaak: zaken van burger, zaak, zaaktype (cache)
├── fake.py                  fictieve zaken voor Anna
└── tests/                   (VCR-cassettes pas met echte testomgeving)

src/verificatie_client/                            NIEUW  interface + nep-implementatie tot Worth documentatie levert
├── client.py                verificatie_starten(...), verificatie_bevestigen(...)
└── fake.py

src/openklant/components/klantinteracties/
├── models/communicatievoorkeuren.py       NIEUW  Zaaktype, ZaaktypeKanaal, Communicatievoorkeur   (zie models/actoren.py: verwante modellen in één bestand)
├── models/constants.py                    WIJZIG TextChoices Voorkeurskanaal: email|sms|berichtenbox|brief
├── models/validators.py                   WIJZIG regels §4.2
├── models/__init__.py                     WIJZIG `from .communicatievoorkeuren import *  # noqa` (bestaand sterimport-patroon)
├── models/tests/factories/communicatievoorkeuren.py   NIEUW  ZaaktypeFactory, ZaaktypeKanaalFactory, CommunicatievoorkeurFactory   (zie factories/partijen.py)
├── models/tests/factories/__init__.py     WIJZIG zelfde sterimport als hierboven
├── models/tests/test_communicatievoorkeuren.py        NIEUW  een test per validatieregel uit §4.2   (zie models/tests/test_partijen.py)
├── migrations/00NN_*.py                   NIEUW  via makemigrations: stap 3 `zaaktype` + `zaaktypekanaal`, stap 4 `communicatievoorkeur`
├── admin/communicatievoorkeuren.py        NIEUW  ZaaktypeAdmin + inline ZaaktypeKanaal (kanaalbeheer gemeente); CommunicatievoorkeurAdmin met raw_id_fields=("partij","zaaktype","digitaal_adres")
├── admin/__init__.py                      WIJZIG `from .communicatievoorkeuren import *  # noqa`
├── api/serializers/communicatievoorkeuren.py          NIEUW
├── api/filterset/communicatievoorkeuren.py            NIEUW
├── api/viewsets/communicatievoorkeuren.py, voorkeurskanaal.py   NIEUW  (zie viewsets/digitaal_adres.py)
├── api/urls.py                            WIJZIG router.register + pad voorkeurskanaal
├── api/tests/test_communicatievoorkeuren.py, test_voorkeurskanaal.py   NIEUW
├── metrics.py                             WIJZIG counters
└── openapi.yaml                           WIJZIG gegenereerd: bin/generate_schema_for_component.sh klantinteracties

src/openklant/conf/base.py                 WIJZIG 1) `sys.path.append(str(BASE_DIR))` zodat `com_voorkeur_portaal` (repo-root) importeerbaar is, 2) "com_voorkeur_portaal" in INSTALLED_APPS, 3) instelling fake/echt Open Zaak
src/openklant/urls.py                      WIJZIG path("portal/", include("com_voorkeur_portaal.urls"))
pyproject.toml                             WIJZIG [tool.ruff.lint.isort] known-first-party = ["openklant", "com_voorkeur_portaal"]
.github/workflows/ci.yml                   WIJZIG teststap: `coverage run src/manage.py test src com_voorkeur_portaal`
Dockerfile                                 WIJZIG (pas bij een eigen image-build) `COPY ./com_voorkeur_portaal /app/com_voorkeur_portaal` onder `COPY ./src /app/src`
docker/setup_configuration/data.yaml       WIJZIG Service voor Open Zaak (zonder secrets; verwijs naar env/begeleider)

docs/HvA/
├── PLAN_VAN_AANPAK.md                     dit bestand
├── ONTWERPKEUZE_ROUTE_C.md                NIEUW  onderbouwing van de keuze voor OpenKlant + onderzoeksbevindingen (oplevering)
├── API_BESCHRIJVING_OMC.md                NIEUW  korte beschrijving hoe OMC bevraagt (oplevering)
├── onderzoek/{gebruikersonderzoek.md, privacy_avg.md, wireframes/}   NIEUW  (spoor 2)
└── DEMO.md                                NIEUW  demoscript
CHANGELOG.rst                              WIJZIG
```

Gecontroleerd tegen de repo (2026-10-20): alle genoemde bestaande bestanden en mappen bestaan (`models/validators.py`, `admin/__init__.py`, `api/urls.py`, `metrics.py`, `openapi.yaml`, `scss/views/_index.scss`, `js/views/index.js`, `jstests/views/`, `docker/setup_configuration/data.yaml`, `pyproject.toml`, `.github/workflows/ci.yml`, `Dockerfile`, `CHANGELOG.rst`); `com_voorkeur_portaal/` bestaat nog niet. `scss/views/_index.scss`, `js/views/index.js` en `jstests/views/` bevatten nog niets (alleen een commentaar of `.gitkeep`).

Praktische regels voor deze indeling:

- **Eén bestand per laag, genoemd naar het onderwerp.** De drie nieuwe modellen horen bij elkaar en staan daarom samen in `communicatievoorkeuren.py` (models, factories, admin, serializers, filterset, viewsets, tests). Dat volgt het bestaande patroon: `actoren.py` bevat `Actor`, `Medewerker`, `GeautomatiseerdeActor` en `OrganisatorischeEenheid`. Maak dus niet per model een eigen bestand; splits pas als een bestand onoverzichtelijk wordt.
- **`com_voorkeur_portaal/` staat buiten `src/`, dus maak hem expliciet importeerbaar.** `python src/manage.py` zet alleen `src/` op `sys.path`, niet de repo-root; zonder maatregel faalt `INSTALLED_APPS` met `ModuleNotFoundError: No module named 'com_voorkeur_portaal'`. De oplossing is één regel in `src/openklant/conf/base.py`, ná de import van `open_api_framework.conf.base` (die levert `BASE_DIR` = de repo-root): `sys.path.append(str(BASE_DIR))`. Settings worden door `manage.py`, uWSGI en Celery allemaal geladen, dus dat dekt alle ingangen. Gebruik `append` (laagste prioriteit), want de repo-root bevat ook mappen als `migration/`, `build/` en `docker/` die geen pakketten zijn. Een `PYTHONPATH=.` in je shell werkt ook, maar zet je zo bij iedere nieuwe terminal opnieuw.
- **Eén richting van afhankelijkheid.** `com_voorkeur_portaal` importeert uit `openklant.components.klantinteracties.models` en uit `zaken_client`/`verificatie_client`; `src/` importeert nooit uit de portal-app (alleen `conf/base.py` en `urls.py` verwijzen ernaar). Zo blijft de nieuwe frontend los van de rest.
- **Tests, ruff en Docker kijken standaard alleen naar `src/`.** Draai de portaltests met `python src/manage.py test com_voorkeur_portaal` (vanuit de repo-root) en alles met `python src/manage.py test src com_voorkeur_portaal`; pas `ci.yml` daarop aan. Voer `ruff check src com_voorkeur_portaal` en `ruff format src com_voorkeur_portaal` uit. Controleer in stap 2 dat de runner een triviale test in `com_voorkeur_portaal/tests/` echt vindt, voordat je erop vertrouwt. Het `Dockerfile` kopieert alleen `./src`: voeg de `COPY` voor de root-map pas toe als je zelf een image bouwt. `docker compose up --no-build` draait de gepubliceerde upstream-image en bevat jouw code toch niet, ook niet die in `src/`.
- **Elke nieuwe map met Python-code krijgt een `__init__.py`**, ook `tests/` (`com_voorkeur_portaal/tests/`, `zaken_client/tests/`, `verificatie_client/tests/`). Zonder `__init__.py` vindt de testrunner de tests niet en geeft de systeemcheck `maykin.W001` (zoals eerder bij `cloud_events`).
- **`src/zaken_client/` en `src/verificatie_client/` zijn losse pakketten, geen Django-apps**, net als `src/referentielijsten_client/` (niet in `INSTALLED_APPS`). Alleen `com_voorkeur_portaal` komt in `INSTALLED_APPS`. De clients blijven bewust in `src/` (zelfde patroon als `referentielijsten_client`); wil je al je eigen code in één map, dan kunnen ze als submappen naar `com_voorkeur_portaal/`.
- **Fixtures**: Django zoekt fixtures automatisch in `fixtures/` van elke geïnstalleerde app, dus `com_voorkeur_portaal/fixtures/portal_demo.json` laadt met `python src/manage.py loaddata portal_demo` zonder verdere instelling. De fixture mag ook modellen uit `klantinteracties` bevatten. (De bestaande fixtures uit de README-quickstart blijven waar ze zijn.)
- **Templates**: de app-directory-loader vindt `com_voorkeur_portaal/templates/`; zet de bestanden in de submap `com_voorkeur_portaal/` en render ze als `"com_voorkeur_portaal/voorkeuren.html"`. `{% extends "master.html" %}` blijft werken, want die staat in `DIRS` (`src/openklant/templates`).
- **De `scripts`-hook**: `master.html` heeft een leeg `{% block scripts %}`; gebruik die in `com_voorkeur_portaal/base.html` voor de JS-bundel.
- **Geen notificaties** voor de nieuwe resources: ze krijgen geen `NotificationViewSetMixin` en dus ook geen wijziging in `kanalen.py` of `src/notificaties.md` (zie open vraag 11 voor een latere uitbreiding).

Let op de migratienummering: lokaal is `0048_...` de laatste migratie; de `latest`-image bevat al een `0049_internetaken_actoren_verbose_name`. Geef je migratie een beschrijvende naam en reken op hernummeren bij een upstream-merge.

## 6. Stappenplan: waar beginnen we

We werken in kleine commits naar `dev` (gitmoji + issue-nummer, zie de skill-referentie `conventions.md`). Na elke stap: `python src/manage.py check` en de relevante tests. De volgorde zorgt dat we **vroeg iets kunnen laten zien**.

**Stap 1 - Omgeving draaiend** (`docs/HvA/HVA_INSTALL.rst`). `docker compose up`, `.env`, `check`. Let op: `--no-build` draait de gepubliceerde image, niet jouw code; draai je wijzigingen via `python src/manage.py runserver 8001`.
Of draai `docker compose up -d db` Als je dan een error krijgt over permissies: `docker compose exec db psql -U postgres -d openklant -c "ALTER DATABASE openklant OWNER TO openklant; GRANT ALL ON SCHEMA public TO openklant;`

**Stap 2 - Statisch scherm (eerste demo-resultaat).** Maak in de repo-root de map `com_voorkeur_portaal/` met `__init__.py`, `apps.py`, `urls.py`, `views.py` en `voorkeuren.html` met hardcoded nepdata in de view (de drie zaken uit §1), opmaak in SCSS en alleen de zichtbare "TESTLOGIN"-banner. Koppel hem in drie regels aan het project: de `sys.path`-regel en `INSTALLED_APPS` in `src/openklant/conf/base.py`, en de `include` in `src/openklant/urls.py` (zie §5). Controleer daarna in deze volgorde: `python src/manage.py check` (faalt dit met `ModuleNotFoundError`, dan ontbreekt de `sys.path`-regel), een triviale test in `com_voorkeur_portaal/tests/` met `python src/manage.py test com_voorkeur_portaal`, en `runserver 8001` met `/portal/voorkeuren/`. De echte mock-login (testpartij kiezen) volgt in stap 5, want die heeft de database nodig. Geen Open Zaak nodig. Vergeet niet de JS-bundel in `com_voorkeur_portaal/base.html` te laden. Toets dit scherm meteen met spoor 2. `npm ci && npm run build` (of `npm run watch`).

**Stap 3 - Gemeente-kant: `Zaaktype` + `ZaaktypeKanaal` + admin.** Maak `models/communicatievoorkeuren.py` met deze twee modellen, de migratie, de factories en de admin met inline. Een beheerder zet in de admin voor *kapvergunning* e-mail en Berichtenbox open. Maak hier ook de demofixture `com_voorkeur_portaal/fixtures/portal_demo.json` (zaaktypen, toegestane kanalen, testpartij Anna met adressen) en laad hem met `python src/manage.py loaddata portal_demo`.

**Stap 4 - `Communicatievoorkeur` + validatie.** Voeg het model toe aan hetzelfde `models/communicatievoorkeuren.py`, maak de migratie en de validators uit §4.2 met een test per regel in `models/tests/test_communicatievoorkeuren.py` (niet-toegestaan kanaal, ongeverifieerd adres, adres van andere partij, zaak van andere partij). Admin met `raw_id_fields` (anders faalt `openklant.E001`).

**Stap 5 - Scherm met echte voorkeuren, nog met fake zaken.** Voeg de mock-login toe (`com_voorkeur_portaal/auth.py`: kies een testpartij, alleen bij `DEBUG`). `zaken_client/fake.py` levert Anna's zaken; `services.py` combineert ze met zaaktypen en voorkeuren; het formulier slaat op. Nu is het scherm **end-to-end bruikbaar** zonder Open Zaak. Het formulier werkt zonder JS; `voorkeuren.js` voegt gemak toe.

**Stap 6 - `voorkeurskanaal`-API voor het OMC.** Schrijf eerst twee tests: (a) de opdracht: Anna heeft voor kapvergunning "e-mail" gekozen → antwoord `email`, bron `zaaktype`; (b) uitzondering: voor één zaak "berichtenbox" → antwoord `berichtenbox`, bron `zaak`. Daarna viewset, filterset, router, `openapi.yaml`, `API_BESCHRIJVING_OMC.md`.

**Stap 7 - Contactgegevens en verificatie.** Pagina voor adressen toevoegen en verifiëren; `verificatie_client` met nep-implementatie die `verificatie_datum` zet. Echte NotifyNL pas als Worth documentatie en testgegevens levert.

**Stap 8 - Echte Open Zaak.** Vervang fake door `zaken_client/client.py` tegen de testomgeving; neem geen tokens op in code of commit (zie `docs/HvA/NOTIFY_TESTOMGEVING_API.rst` en de regels in de skill). Foutafhandeling voor "Open Zaak niet bereikbaar" in het scherm.

**Stap 9 - Afronden en demo.** Toegankelijkheid, foutmeldingen in het Nederlands, `ruff`, volledige testsuite, `CHANGELOG.rst`, demoscript, ontwerpkeuze-document, PR naar `dev`.

**Bij tijdnood** is stap 2-6 het minimale prototype: gemeente-kanaalbeheer, scherm voor de inwoner en het OMC-antwoord. Verificatie (7) en echte Open Zaak (8) mogen nep blijven, mits je dat in de demo zegt.

## 7. Spoor 2: onderzoek & ontwerp

| Spoor-2 onderdeel | Wat het oplevert voor de bouw | Waar |
|---|---|---|
| Gebruikersonderzoek (medewerkers + inwoners) | Welke soorten zaak, welke kanalen, welke woorden; willen inwoners per zaak én standaard kiezen? | `docs/HvA/onderzoek/gebruikersonderzoek.md` |
| Wireframes, getoetst | Het scherm in §1 is een eerste schets: toets en verbeter vóór stap 5 | `docs/HvA/onderzoek/wireframes/` |
| Privacy & AVG | Grondslag, bewaartermijn van voorkeuren/adressen, verantwoordelijke (gemeente of centrale dienst); beïnvloedt verwijderen en logging | `docs/HvA/onderzoek/privacy_avg.md` |
| Begrijpelijke taal | "Zaaktype" begrijpt een inwoner niet; test "soort zaak", "waarover", enz.; ook voor de uitleg bij sms/brief | labels in `Zaaktype.naam`, templates, helpteksten |

Geef spoor 2 vroeg het statische scherm (stap 2) en later de admin met demodata, zodat tests over echte schermen gaan.

## 8. Opleveringen en definition of done

| Oplevering (uit de opdracht) | Waar |
|---|---|
| Werkend prototype kanaalbeheer + burgervoorkeuren | admin (gemeente), `/portal/voorkeuren/` (inwoner), API |
| Onderbouwde ontwerpkeuze (verder bouwen op OpenKlant) + onderzoeksbevindingen | `ONTWERPKEUZE_ROUTE_C.md` |
| Korte API-beschrijving voor OMC | `API_BESCHRIJVING_OMC.md` + gegenereerd `openapi.yaml` |
| Wireframes + samenvatting gebruikersonderzoek | `onderzoek/` |
| Korte demo voor Worth (en gemeente) | `DEMO.md` + demofixture |

Technisch:

- [ ] De twee scenario's uit stap 6 zijn automatische tests en slagen.
- [ ] Elke validatieregel uit §4.2 heeft een test.
- [ ] Het scherm toont alleen de door de gemeente toegestane kanalen per soort zaak.
- [ ] Het scherm werkt zonder JavaScript, met toetsenbord, en met duidelijke Nederlandse foutmeldingen.
- [ ] `manage.py check` schoon (incl. `openklant.E001`), `ruff check src com_voorkeur_portaal` en `ruff format src com_voorkeur_portaal` schoon, `python src/manage.py test src com_voorkeur_portaal` groen.
- [ ] `openapi.yaml` opnieuw gegenereerd; OMC-endpoint beschreven.
- [ ] Geen tokens, echte BSN's of echte persoonsgegevens in code, fixtures, tests of commits; mock-login is zichtbaar gemarkeerd en alleen actief bij `DEBUG`.

## 9. Risico's en keuzes die je moet onderbouwen

| Risico / keuze | Toelichting |
|---|---|
| **Het OMC leest nu geen voorkeuren** | Het OMC gebruikt een vaste volgorde (e-mail, sms, brief). Jullie leveren het antwoord-endpoint en de beschrijving, niet de OMC-aanpassing (.NET, andere repo). Zeg dat in de demo; simuleer eventueel met `curl`. |
| **Eerste bericht vóór de keuze** | Daarom bestaat de standaard per soort zaak (§1). Zonder die standaard blijft het eerste bericht op de OMC-volgorde draaien. |
| **Verder bouwen op OpenKlant (route C)** | Voordeel: hergebruik van `Partij`/`DigitaalAdres`/token-auth, aansluiting op wat al bij gemeentes draait. Nadeel: OpenKlant is een registratiecomponent zonder inwonerpagina's; een apart portaal ligt voor productie meer voor de hand. Beschrijf dat eerlijk in `ONTWERPKEUZE_ROUTE_C.md`. |
| **Afhankelijkheid van Open Zaak** | Zaken staan daar; zonder testtoegang werk je met de fake-client. Plan het vragen van toegang vroeg. |
| **Versieverschil testomgeving** | De OpenKlant-testomgeving publiceert een spec met versie `0.7.0`; onze fork `0.9.0`. De paden zijn gelijk (29), maar de testomgeving mist o.a. `hoofdOnderwerpType` en `verdereActieOndernomen` op klantcontacten (toegevoegd in 2.18.0), dus hij draait een oudere OpenKlant dan deze fork. Gevolgen: (1) onze nieuwe endpoints (`communicatievoorkeuren`, `voorkeurskanaal`) bestaan alleen op de lokale instantie, niet in de testomgeving; demonstreer het OMC-gedrag dus met `curl` tegen de lokale instantie; (2) bouw niets dat afhankelijk is van velden die de testomgeving niet kent als je daar tegenaan praat. |
| **`Zaaktype.identificatie` is uniek binnen een catalogus** | De identificatie is uniek binnen een catalogus, niet noodzakelijk over catalogi heen. Aanname: één catalogus in de testomgeving; bij meerdere catalogi moet `Zaaktype` ook de catalogus kennen. |
| **Open Zaak-koppeling** | Alleen gelezen (zaken, zaaktypen); we schrijven niets terug. Filters en `expand` zijn gecontroleerd in de spec, maar nog niet tegen een echt antwoord. |
| **Nieuwe API = contractwijziging** | `KLANTINTERACTIES_API_VERSION` in `conf/api.py`, changelog; overleg wat past bij een fork. |
| **Persoonsgegevens** | Alleen testdata; log UUID's, geen BSN, adressen of namen. |
| **Upstream-merge** | Eigen bestanden voor nieuwe code (de map `com_voorkeur_portaal/` in de repo-root, nieuwe modellen/viewsets); bestaande bestanden minimaal aanpassen. De portal-app raakt `src/` alleen via `conf/base.py`, `urls.py`, `pyproject.toml`, `ci.yml` en de SCSS/JS-bundel. |

## Bijlage A: API-specs van de testomgeving

Openbaar op te halen (geen token nodig voor de spec zelf); de aangeleverde `.../schema/`-pagina's zijn ReDoc-weergaven van deze bestanden. Gebruik `.json` of `.yaml` in plaats van de HTML-pagina wanneer je een spec wilt downloaden of vergelijken.

| API | Versie in spec | Spec |
|---|---|---|
| Catalogi (Open Zaak) | 1.3.1 | `https://openzaak.test.notifynl.nl/catalogi/api/v1/schema/openapi.json` (of `.yaml`) |
| Zaken (Open Zaak) | 1.5.1 | `https://openzaak.test.notifynl.nl/zaken/api/v1/schema/openapi.json` |
| Klantinteracties (OpenKlant) | 0.7.0 | `https://openklantv2.test.notifynl.nl/klantinteracties/api/v1/openapi.json` (of `.yaml`) |
| Contactgegevens (OpenKlant) | 1.1.1 | `https://openklantv2.test.notifynl.nl/contactgegevens/api/v1/openapi.json` |
| Open Notificaties | 1.0.0 | `https://opennotificaties.test.notifynl.nl/api/v1/schema/openapi.json` (of `.yaml`) |

Wat voor dit plan relevant is:

- **Zaken:** `GET /zaken` met `rol__betrokkeneIdentificatie__natuurlijkPersoon__inpBsn`, `rol__omschrijvingGeneriek`, `expand`, `zaaktype`, `startdatum`/`einddatum`-filters, `page`/`pageSize` (max 500), header `Accept-Crs`. Verder `POST /zaken/_zoek`, `/rollen`, `/statussen`.
- **Catalogi:** `GET /zaaktypen` (`identificatie`, `omschrijving`, `status=definitief`), `GET /statustypen` (met `informeren`, `isEindstatus`, `volgnummer`).
- **Klantinteracties (test):** zelfde 29 paden als de fork, `digitaleadressen` met `isGeverifieerd`, `verificatieDatum` en `verstrektDoorPartij__partijIdentificator__*`; `partijen` met `partijIdentificator__*` en `expand`. Daarmee kan het OMC een partij/adres op BSN vinden zonder extra werk.
- **Open Notificaties:** `abonnement` (`callbackUrl`, `auth`, `kanalen: [{naam, filters}]`, `sendCloudevents`, `cloudeventFilters`), `kanaal` (`naam`, `documentatieLink`, `filters`), `POST /notificaties`, `POST /cloudevents`. Security-schema `JWT-Claims`. Handig om te weten hoe het OMC zich op `zaken`/`objecten`/`besluiten` abonneert (zie `integrations.md`); jullie hoeven hier niets aan te bouwen.

Download specs in een eigen map (bijv. de scratchpad of `/tmp/<naam>/`), niet in de repo, en lees ze met een script dat je buiten die map bewaart.
