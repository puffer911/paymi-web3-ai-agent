import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="300" 
            height="100" 
            viewBox="0 0 300 100"
            className={styles.logo}
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#0070f3', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#00dfd8', stopOpacity:1}} />
              </linearGradient>
            </defs>
            <text x="50%" y="50%" textAnchor="middle" fontSize="40" fontWeight="bold" fill="url(#logoGradient)">
              Paymi
            </text>
            <text x="50%" y="75%" textAnchor="middle" fontSize="18" fill="#666">
              Web3 Invoice AI
            </text>
          </svg>
          <h2>AI-Powered Web3 Invoice Management</h2>
          <p className={styles.subheader}>
            Seamlessly create, track, and pay invoices on the TRON blockchain 
            using intelligent Telegram interactions
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature} style={{background: 'linear-gradient(145deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)'}}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="50" 
              height="50" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <h3>Blockchain-Powered</h3>
            <p>Secure, transparent invoicing on TRON network</p>
          </div>
          <div className={styles.feature} style={{background: 'linear-gradient(145deg, #00B4DB 0%, #0083B0 100%)'}}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="50" 
              height="50" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>AI-Driven</h3>
            <p>Intelligent intent recognition via Telegram</p>
          </div>
          <div className={styles.feature} style={{background: 'linear-gradient(145deg, #56ab2f 0%, #a8e063 100%)'}}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="50" 
              height="50" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <h3>USDT Payments</h3>
            <p>Instant, low-fee stablecoin transactions</p>
          </div>
        </div>

        <div className={styles.ctas}>
          <Link
            className={styles.primary}
            href="https://web.telegram.org/k/#@PaymiTronBot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0 2c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm4.5 6.5c0-.276-.224-.5-.5-.5s-.5.224-.5.5v2.379l-3.879-3.879c-.195-.195-.512-.195-.707 0s-.195.512 0 .707l3.879 3.879h-2.379c-.276 0-.5.224-.5.5s.224.5.5.5h3c.276 0 .5-.224.5-.5v-3z"/>
            </svg>
            Start Receive Payment Flawlessly
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>
            © {new Date().getFullYear()} Paymi. 
            Powering Web3 Invoicing with AI
          </p>
          <div className={styles.footerLinks}>
            <a 
              href="https://github.com/puffer911/paymi-web3-ai-agent" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}