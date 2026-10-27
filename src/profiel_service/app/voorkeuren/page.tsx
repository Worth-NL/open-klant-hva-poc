import type { Metadata } from "next";
import { ChatIcoon, LoketIcoon, MailIcoon } from "@/components/Icons";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Mijn contact met de gemeente",
};

// Hardcoded nepdata, 1 op 1 overgenomen uit het wireframe (docs/HvA/afbeelding.png).
// Wordt in latere stappen vervangen door gegevens uit Open Zaak en OpenKlant.

const contactgegevens = [
    {
        titel: "Emailadres",
        uitleg: "Voor sommige diensten is het belangrijk dat het email adres actief beheerd wordt.",
        waarde: "a.boukema@amsterdam.nl",
        standaard: false,
        meta: "laatst gevalideerd op 1-1-2026",
        acties: ["valideer opnieuw", "wijzig"],
    },
    {
        titel: "Mobiele telefoonnummer",
        uitleg: "Voor sommige diensten is het belangrijk dat het telefoonnummer actief beheerd wordt.",
        waarde: "0618394078",
        standaard: true,
        meta: "laatst gevalideerd op 1-1-2026",
        acties: ["valideer opnieuw", "wijzig"],
    },
    {
        titel: "Amsterdam App",
        uitleg: "Als u de Amsterdam App download en toestemming geeft om meldingen van Mijn Amsterdam te versturen.",
        waarde: "Amsterdam App ID: 8593619876",
        standaard: false,
        meta: "gedownload op op 1-1-2026",
        acties: ["ontkoppel"],
    },
    {
        titel: "Berichtenbox",
        uitleg: "Als u de berichtbox toestemming heeft gegeven om namens gemeente Amsterdam te versturen.",
        waarde: "Nog niet gekoppeld",
        standaard: false,
        meta: "",
        acties: ["koppel"],
    },
];

const contactmomenten = [
    { vorm: "Chat", icoon: ChatIcoon, onderwerp: "Zorg" },
    { vorm: "Mail", icoon: MailIcoon, onderwerp: "Zorg" },
    { vorm: "Stadsloket", icoon: LoketIcoon, onderwerp: "Gemiste afspraak" },
    { vorm: "Stadsloket", icoon: LoketIcoon, onderwerp: "Zorg" },
    { vorm: "Chat", icoon: ChatIcoon, onderwerp: "Zorg" },
];

function Grijs({ children }: { children: React.ReactNode }) {
    return <span className={styles.grijs}>{children}</span>;
}

function Wijzig({ context }: { context: string }) {
    return (
        <a href="#" className={styles.wijzig}>
            wijzig
            <span className={styles.verborgen}> {context}</span>
        </a>
    );
}

export default function VoorkeurenPage() {
    return (
        <>
            <nav aria-label="Kruimelpad" className={styles.kruimelpad}>
                <a href="#">Home</a>
            </nav>

            <h1 className={styles.h1}>Mijn contact met de gemeente</h1>
            <p className={styles.intro}>
                Hier regelt u uw contact voorkeuren, zoals wilt u de post van de
                gemeente alleen digitaal ontvangen, aanpassen van uw afspraken
                met de gemeente en het wijzigen van uw e-mailadres of
                telefoonnummer.
            </p>

            <section
                aria-labelledby="contactgegevens"
                className={styles.sectie}
            >
                <h2 id="contactgegevens" className={styles.h2}>
                    Mijn contactgegevens
                </h2>
                <p className={styles.sectieIntro}>
                    Via welk medium u geïnformeerd wilt worden als er
                    bijvoorbeeld een bericht voor u klaar staat of een status
                    van een product is veranderd.
                </p>

                {contactgegevens.map((c) => (
                    <div key={c.titel} className={styles.groep}>
                        <h3 className={styles.h3}>{c.titel}</h3>
                        <p className={styles.uitleg}>{c.uitleg}</p>
                        <div className={styles.rij}>
                            <span>
                                {c.standaard && <Grijs>standaard</Grijs>}
                                {c.standaard && ": "}
                                {c.waarde}
                                {c.meta && ` (${c.meta})`}
                            </span>
                            <span>
                                <a href="#" className={styles.link}>
                                    {c.acties[0]}
                                    <span className={styles.verborgen}>
                                        {" "}
                                        {c.titel}
                                    </span>
                                </a>
                            </span>
                            <span>
                                {c.acties[1] && (
                                    <a href="#" className={styles.link}>
                                        {c.acties[1]}
                                        <span className={styles.verborgen}>
                                            {" "}
                                            {c.titel}
                                        </span>
                                    </a>
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </section>

            <section aria-labelledby="voorkeuren" className={styles.sectie}>
                <h2 id="voorkeuren" className={styles.h2}>
                    Mijn communicatievoorkeuren
                </h2>
                <p className={styles.sectieIntro}>
                    Nog niet alle diensten van de gemeente zijn aangesloten bij
                    de generieke communicatievoorkeuren. Het kan dus zijn dat er
                    nog elders binnen de gemeente contactgegevens van u worden
                    gebruikt voor berichtgeving over thema&apos;s die niet
                    hieronder staan benoemd. Heeft u daar vragen over bel dan
                    naar 14020.
                </p>

                <div className={styles.tabelwrap}>
                    <table className={styles.voorkeuren}>
                        <thead>
                            <tr>
                                <th scope="col">
                                    Thema
                                    <span className={styles.subkop}>
                                        Dit zijn de thema&apos;s voor waar je
                                        via Mijn Amsterdam je digitale voorkeur
                                        kan doorgeven
                                    </span>
                                </th>
                                <th scope="col">
                                    Bericht locaties
                                    <span className={styles.subkop}>
                                        Belangrijke berichten zoals
                                        besluitdocumenten, vergunningen kunnen
                                        zowel per post als digitaal worden
                                        aangeboden
                                    </span>
                                </th>
                                <th scope="col">
                                    Notificaties ontvangen op
                                    <span className={styles.subkop}>
                                        Via welk medium u geïnformeerd wilt
                                        worden als er bijvoorbeeld een bericht
                                        voor u klaar staat of een status van een
                                        product is veranderd.
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.standaardRij}>
                                <th scope="row" className={styles.grijsRij}>
                                    Standaard instelling
                                </th>
                                <td>Mijn Amsterdam</td>
                                <td>
                                    a.boukema@amsterdam.nl, de AmsterdamApp{" "}
                                    <Wijzig context="standaard instelling" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <a href="#" className={styles.link}>
                                        Zorg en ondersteuning
                                    </a>
                                </th>
                                <td>
                                    <Grijs>standaard</Grijs>, berichtenbox, per
                                    post{" "}
                                    <Wijzig context="Zorg en ondersteuning: bericht locaties" />
                                </td>
                                <td>
                                    <Grijs>standaard</Grijs>{" "}
                                    <Wijzig context="Zorg en ondersteuning: notificaties" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <a href="#" className={styles.link}>
                                        Erfpacht
                                    </a>
                                </th>
                                <td>
                                    <Grijs>standaard</Grijs>{" "}
                                    <Wijzig context="Erfpacht: bericht locaties" />
                                </td>
                                <td>
                                    <Grijs>standaard</Grijs>, sms: 06-18394078,
                                    berichtenbox{" "}
                                    <Wijzig context="Erfpacht: notificaties" />
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">
                                    <a href="#" className={styles.link}>
                                        Stadspas
                                    </a>
                                </th>
                                <td>
                                    <Grijs>standaard</Grijs>, per post{" "}
                                    <Wijzig context="Stadspas: bericht locaties" />
                                </td>
                                <td>
                                    <Grijs>standaard</Grijs>{" "}
                                    <Wijzig context="Stadspas: notificaties" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section aria-labelledby="afspraken" className={styles.sectie}>
                <h2 id="afspraken" className={styles.h2}>
                    Mijn afspraken bij een stadsloket
                </h2>
                <article className={styles.afspraak}>
                    <LoketIcoon className={styles.afspraakIcoon} />
                    <div className={styles.afspraakInhoud}>
                        <h3 className={styles.afspraakTitel}>
                            Burgerzaken: afhalen paspoort
                        </h3>
                        <p>Datum, 4 augustus 2025, 13-14 uur</p>
                        <p>
                            <a href="#" className={styles.link}>
                                Locatie Stadsloket Nieuw-West, Osdorpplein 12
                            </a>
                        </p>
                        <p>
                            <a href="#" className={styles.link}>
                                Voeg toe aan uw privé agenda
                            </a>
                        </p>
                        <button type="button" className={styles.knop}>
                            Toon QR code
                        </button>
                    </div>
                    <a href="#" className={styles.wijzig}>
                        Annuleren
                        <span className={styles.verborgen}>
                            {" "}
                            afspraak afhalen paspoort
                        </span>
                    </a>
                </article>
            </section>

            <section
                aria-labelledby="contactmomenten"
                className={styles.sectie}
            >
                <h2 id="contactmomenten" className={styles.h2}>
                    Mijn contactmomenten{" "}
                    <a href="#" className={styles.wijzig}>
                        Toon alle
                    </a>
                </h2>
                <div className={styles.tabelwrap}>
                    <table className={styles.momenten}>
                        <thead>
                            <tr>
                                <th scope="col">Contactvorm</th>
                                <th scope="col">Onderwerp</th>
                                <th scope="col">Datum</th>
                                <th scope="col">Referentie nummer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contactmomenten.map((m, i) => {
                                const Icoon = m.icoon;
                                return (
                                    <tr key={i}>
                                        <td>
                                            <span className={styles.vorm}>
                                                <Icoon /> {m.vorm}
                                            </span>
                                        </td>
                                        <td>{m.onderwerp}</td>
                                        <td>21 augustus 2024</td>
                                        <td>0012345678</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className={styles.toonAlleOnder}>
                    <a href="#" className={styles.link}>
                        Toon alle
                    </a>
                </p>
            </section>
        </>
    );
}
