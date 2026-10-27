import styles from "./TestloginBanner.module.css";

export default function TestloginBanner() {
    return (
        <div className={styles.banner} role="note">
            <strong>TESTLOGIN</strong> · Dit is een prototype met nepgegevens. U
            bent niet echt ingelogd en er worden geen persoonsgegevens gebruikt.
        </div>
    );
}
