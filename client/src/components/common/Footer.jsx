import "../../styles/Common.css";

function Footer() {
    return (
        <footer className="footer">
            <p>
                © {new Date().getFullYear()} AquaCart. All rights reserved.
            </p>
        </footer>
    );
}

export default Footer;