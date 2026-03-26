// pharmacy/components/home/HeroSection.jsx
import Link from "next/link";
import styles from "./HeroSection.module.css";

const STATS = [
  { value: "15+",  label: "Years Experience" },
  { value: "500+", label: "Happy Clients"    },
  { value: "10k+", label: "Products"         },
];

// Arrow icon for primary CTA
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section id='home' className={styles.hero}>

      {/* ── BACKGROUND LAYERS ── */}
      <div className={styles.bgImage} />
      <div className={styles.bgOverlay} />  
      <div className={styles.bgDepth} />     

      {/* Ambient blobs */}
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      {/* ── MAIN CONTENT ── */}
      <div className={styles.content}>
        <div className={styles.inner}>

          {/* Trust badge */}
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span className={styles.badgeText}>Trusted by 500+ Healthcare Facilities</span>
          </div>

          {/* Headline */}
          <h1 className={styles.headline}>
            Your Trusted Partner in
            <span className={styles.headlineAccent}>Medical Supplies</span>
          </h1>

          {/* Sub-copy */}
          <p className={styles.subtext}>
            Providing healthcare facilities with quality medical equipment and
            supplies for over 15 years. We ensure timely delivery and exceptional
            service for all your medical needs.
          </p>

          {/* CTA buttons */}
          <div className={styles.ctaGroup}>
            <Link href="/services" className={styles.btnPrimary}>
              Explore Services <ArrowIcon />
            </Link>
            <Link href="/contact" className={styles.btnOutline}>
              Contact Us
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            {STATS.map(({ value, label }) => (
              <div key={label} className={styles.stat}>
                <div className={styles.statValue}>{value}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    {/* Dramatically curved wave divider */}
      <div className={styles.wave}>
        <svg 
          viewBox="0 0 1440 180" 
          preserveAspectRatio="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={styles.waveSvg}
        >
          {/* Main curved wave */}
          <path 
            d="M0,160 C240,100 360,40 480,50 C600,60 720,120 840,140 C960,160 1080,140 1200,110 C1320,80 1380,60 1440,50 L1440,180 L0,180 Z" 
            fill="#f8fafc"
          />
          {/* Secondary overlapping wave for depth */}
          <path 
            d="M0,150 C240,110 360,70 480,85 C600,100 720,140 840,155 C960,170 1080,160 1200,135 C1320,110 1380,90 1440,80 L1440,180 L0,180 Z" 
            fill="#f8fafc" 
            opacity="0.6"
          />
          {/* Tertiary subtle wave */}
          <path 
            d="M0,170 C240,140 360,115 480,120 C600,125 720,150 840,160 C960,170 1080,165 1200,150 C1320,135 1380,120 1440,115 L1440,180 L0,180 Z" 
            fill="#f8fafc" 
            opacity="0.3"
          />
        </svg>
      </div>
    </section>
  );
}