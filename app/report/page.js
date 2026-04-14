'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { industryDisplay } from '../../lib/industry-display.js';
import { track } from '../../lib/analytics.js';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmt(val, prefix = '', suffix = '') {
  if (val == null) return 'N/A';
  return `${prefix}${typeof val === 'number' ? val.toLocaleString() : val}${suffix}`;
}

function AnimatedScore({ score, tier }) {
  const [current, setCurrent] = useState(0);
  const tierColors = { excellent: '#10b981', moderate: '#f59e0b', challenging: '#ef4444', poor: '#991b1b' };
  const color = tierColors[tier] || '#10b981';

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="score-badge-animated" style={{
      background: `conic-gradient(${color} 0% ${current}%, var(--border) ${current}% 100%)`,
    }}>
      <div className="score-badge-inner">
        <span className="score-badge-number">{current}</span>
      </div>
    </div>
  );
}

function LoadingPercent({ duration = 1500 }) {
  const [pct, setPct] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    let current = 0;
    // Generate 4-6 pause points
    const pausePoints = new Set();
    const pauseCount = 4 + Math.floor(Math.random() * 3);
    while (pausePoints.size < pauseCount) {
      pausePoints.add(10 + Math.floor(Math.random() * 80));
    }

    // Budget: allocate total duration across 101 ticks
    // Pauses get a big share, micro-stutters get a medium share, normal ticks get the rest
    const pauseTime = duration * 0.35; // 35% of time in pauses
    const normalTime = duration * 0.65; // 65% in normal ticking
    const pauseEach = pauseTime / pausePoints.size;
    const normalEach = normalTime / (101 - pausePoints.size);

    const schedule = [];
    for (let i = 0; i <= 100; i++) {
      if (pausePoints.has(i)) {
        schedule.push(pauseEach * (0.7 + Math.random() * 0.6));
      } else if (Math.random() < 0.08) {
        schedule.push(normalEach * 2.5);
      } else {
        schedule.push(normalEach * (0.5 + Math.random()));
      }
    }

    function tick() {
      if (current > 100) return;
      setPct(current);
      if (current < 100) {
        timerRef.current = setTimeout(() => { current++; tick(); }, schedule[current]);
      }
    }
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration]);
  return <>{pct}%</>;
}

// Base sections shown to every industry in the gated preview list.
const baseGatedSections = [
  { icon: '💰', title: 'Estimated Market Capacity', desc: 'Projected customer volume and revenue potential' },
  { icon: '🎯', title: 'What It Takes to Win Here', desc: 'Tailored strategy recommendations for this specific market' },
  { icon: '🗺️', title: 'Interactive Competitive Map', desc: 'Visual heatmap of opportunity zones and competitor locations' },
  { icon: '⭐', title: 'Competitive Insight', desc: 'Aggregate competitor ratings with actionable positioning tips' },
  { icon: '📊', title: 'Key Metrics Dashboard', desc: 'Population, income, walk score, employment, and growth at a glance' },
  { icon: '👥', title: 'Demographic Profile', desc: 'Age, education, home values, vacancy rates, and commute patterns' },
  { icon: '📍', title: 'Nearby Points of Interest', desc: 'Amenities and anchors that drive area traffic' },
  { icon: '📝', title: 'Analysis Summary', desc: 'Data-driven narrative synthesizing all findings' },
];

// Dental-only sections — these correspond to the NPI Registry, Census ACS
// payer-mix, and LEHD daytime workforce integrations that only run for the
// dental industry.
const dentalOnlyGatedSections = [
  { icon: '👥', title: 'Daytime Workforce Profile', desc: 'Federal Census LEHD county employment data — total daytime jobs, top employer industries, worker-to-resident ratio, and average earnings.' },
  { icon: '🏥', title: 'Payer Mix & Insurance Coverage', desc: 'Census ACS insurance breakdown plus your state\'s Medicaid dental policy tier — see who can actually pay for dental care here' },
  { icon: '🦷', title: 'Provider Landscape & Specialty Gaps', desc: 'Federal CMS NPI Registry counts of every licensed dentist by specialty, plus 24-month market growth signals and specialty gap analysis' },
];

// Sections shown after the dental-specific block (kept at the end of the list).
const trailingGatedSections = [
  { icon: '🏢', title: 'Nearby Competitors Table', desc: 'Every competitor with ratings, reviews, address, and distance' },
  { icon: '✅', title: 'Execution Checklist', desc: 'Phased action plan — immediate, short-term, and strategic steps' },
];

function getGatedSections(industry) {
  if (industry === 'dental') {
    return [...baseGatedSections, ...dentalOnlyGatedSections, ...trailingGatedSections];
  }
  return [...baseGatedSections, ...trailingGatedSections];
}

function GatedSection({ locked, onUnlock, industry, children }) {
  if (!locked) return children;
  const gatedSections = getGatedSections(industry);
  return (
    <div className="gated-preview">
      <div className="gated-preview-header">
        <div className="gated-lock-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <div>
          <div className="gated-title">Don't Make This Decision Without the Full Picture</div>
          <div className="gated-subtitle-text">The above score only reflects high-level indicators. The full report reveals why, including hidden risks, competitive pressure, and real opportunity. <strong>The following insights are included in the full report — and often play a critical role in whether a location succeeds or fails:</strong></div>
        </div>
      </div>
      <div className="gated-sections-list">
        {gatedSections.map((section, i) => (
          <div key={i} className="gated-section-item">
            <span className="gated-section-icon">{section.icon}</span>
            <div>
              <div className="gated-section-title">{section.title}</div>
              <div className="gated-section-desc">{section.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="gated-cta-area">
        <div className="gated-cta-headline"><strong>Get a complete expansion analysis in seconds — including market capacity, risks, and strategy</strong></div>
        <div className="gated-warning">&#9888;&#65039; This analysis impacts decisions worth $300K–$1M+ per location</div>
        <button className="gated-cta" onClick={onUnlock}>Get Full Expansion Report &mdash; $149 (Instant Access)</button>
        <div className="gated-guarantee">One-time purchase &middot; Instant access &middot; PDF export included</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, tooltip }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div
      className="metric-card has-tooltip"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="label">
        {label}
        <span className="info-icon">i</span>
      </div>
      <div className="value">{value}</div>
      <div className="detail">{detail}</div>
      {showTip && (
        <div className="metric-tooltip">
          <div className="metric-tooltip-arrow" />
          {tooltip}
        </div>
      )}
    </div>
  );
}

function BreakdownRow({ item, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  // The API returns { label, percent } — no raw weights are exposed.
  const percent = item.percent ?? 0;
  const pct = percent / 100;

  return (
    <div
      className="breakdown-row has-tooltip"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <span className="breakdown-label">
        {item.label}
        <span className="breakdown-info-icon">i</span>
      </span>
      <div className="breakdown-bar-track">
        <div
          className="breakdown-bar-fill"
          style={{
            width: `${pct * 100}%`,
            background: pct >= 0.66 ? 'var(--success)' : pct >= 0.33 ? 'var(--warning)' : 'var(--danger)',
          }}
        />
      </div>
      <span className="breakdown-pts">{percent}%</span>
      {showTip && tooltip && (
        <div className="breakdown-tooltip">
          <div className="breakdown-tooltip-arrow" />
          {tooltip}
        </div>
      )}
    </div>
  );
}

function DemoItem({ label, value, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div
      className="detail-item has-tooltip"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <span className="detail-label">
        {label}
        <span className="detail-info-icon">i</span>
      </span>
      <span className="detail-value">{value}</span>
      {showTip && tooltip && (
        <div className="detail-tooltip">
          <div className="detail-tooltip-arrow" />
          {tooltip}
        </div>
      )}
    </div>
  );
}



export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const pendingResultRef = useRef(null);
  const [compPage, setCompPage] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [activeSection, setActiveSection] = useState('');
  const [industry, setIndustry] = useState('dental');
  const [reportAccess, setReportAccess] = useState('preview');
  const [user, setUser] = useState(null);
  const [viewingSaved, setViewingSaved] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const [postPaymentLoading, setPostPaymentLoading] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authStep, setAuthStep] = useState('email'); // 'email' | 'sent'
  const [authLoading, setAuthLoading] = useState(false);
  const loadingTimers = useRef([]);

  const config = industryDisplay[industry];

  // Side nav sections. Payer Mix and Provider Landscape are dental-only —
  // their underlying data (Census ACS payer mix + NPI Registry) is only
  // populated by /api/analyze when industry === 'dental'. For bars and
  // any other industry, those nav entries are filtered out so users don't
  // click dead links.
  const navSections = [
    { id: 'score', label: 'Score Overview' },
    { id: 'upside-risks', label: 'Upside & Risks' },
    { id: 'market-capacity', label: 'Market Capacity' },
    { id: 'win-strategy', label: 'How to Win' },
    { id: 'map', label: 'Competitive Landscape' },
    { id: 'competitive-insight', label: 'Competitive Insight' },
    { id: 'key-metrics', label: 'Key Metrics' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'anchors', label: 'Points of Interest' },
    { id: 'summary', label: 'Summary' },
    ...(industry === 'dental' ? [
      { id: 'daytime-workforce', label: 'Daytime Workforce' },
      { id: 'payer-mix', label: 'Payer Mix' },
      { id: 'provider-landscape', label: 'Provider Landscape' },
    ] : []),
    { id: 'competitors', label: `Nearby ${config.competitorLabelShort}` },
    { id: 'checklist', label: 'Execution Checklist' },
  ];

  useEffect(() => {
    if (!result) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    navSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [result]);

  const loadingSteps = config.loadingSteps;

  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      loadingTimers.current.forEach(clearTimeout);
      loadingTimers.current = [];

      // 12 small steps (0-5s), then 5 full-width steps with percentages (5-15s)
      const delays = [300, 600, 900, 1300, 1700, 2100, 2500, 2900, 3400, 3900, 4400, 5000, 5800, 7500, 9200, 11000, 12800];
      let stepsComplete = false;

      delays.forEach((delay, i) => {
        const timer = setTimeout(() => setLoadingStep(i), delay);
        loadingTimers.current.push(timer);
      });

      // Mark steps complete after the last step's percentage counter finishes
      // Last step fires at 12800ms, its counter takes 1800ms, plus a small buffer
      const doneTimer = setTimeout(() => {
        stepsComplete = true;
        showResultIfReady();
      }, delays[delays.length - 1] + 2200);
      loadingTimers.current.push(doneTimer);

      // Poll for API result — show report as soon as both steps are done AND API returned
      function showResultIfReady() {
        if (stepsComplete && pendingResultRef.current) {
          const { data, address: addr, industry: ind } = pendingResultRef.current;
          setResult(data);
          track('report_generated', { address: addr, industry: ind, score: data.score });
          pendingResultRef.current = null;
          setLoading(false);
        }
      }

      // Check every 300ms if both conditions are met
      const pollTimer = setInterval(() => {
        showResultIfReady();
      }, 300);
      loadingTimers.current.push({ clear: () => clearInterval(pollTimer) });
    } else {
      loadingTimers.current.forEach((t) => t && (t.clear ? t.clear() : clearTimeout(t)));
      loadingTimers.current = [];
    }
    return () => {
      loadingTimers.current.forEach((t) => t && (t.clear ? t.clear() : clearTimeout(t)));
    };
  }, [loading]);

  // Check auth session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  // Handle redirects: payment success, post-auth checkout, or saved report load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const urlAddress = params.get('address');
    const urlIndustry = params.get('industry');
    const proceedToCheckout = params.get('proceed_to_checkout');
    const reportId = params.get('report_id');

    // Load a saved report from the dashboard
    if (reportId) {
      const isSampleReport = reportId === 'SAMPLE';
      const endpoint = isSampleReport
        ? '/api/reports/sample'
        : `/api/reports/${reportId}`;
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setResult(data.data);
            if (data.industry) setIndustry(data.industry);
            setReportAccess('full');
            setViewingSaved(true);
            if (isSampleReport) setIsSample(true);
          }
        })
        .catch(() => {});
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (sessionId) {
      // Returning from Stripe payment — show dedicated loading, verify, then load report
      setPostPaymentLoading(true);
      window.history.replaceState({}, '', window.location.pathname);
      fetch(`/api/verify-payment?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.paid) {
            track('payment_completed', { address: data.address || urlAddress, industry: data.industry || urlIndustry });
            setReportAccess('full');
            setViewingSaved(true);
            const reportAddress = data.address || urlAddress;
            const reportIndustry = data.industry || urlIndustry || 'dental';
            if (reportAddress) {
              setAddress(reportAddress);
              setIndustry(reportIndustry);
              fetch(`/api/analyze?address=${encodeURIComponent(reportAddress)}&industry=${encodeURIComponent(reportIndustry)}`)
                .then((res) => res.json())
                .then((reportData) => {
                  if (reportData && !reportData.error) {
                    setResult(reportData);
                    // Save report to database
                    fetch('/api/reports/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        stripeSessionId: sessionId,
                        address: reportAddress,
                        industry: reportIndustry,
                        lat: reportData.lat,
                        lon: reportData.lon,
                        reportData,
                      }),
                    }).catch(() => {});
                  }
                })
                .finally(() => setPostPaymentLoading(false));
            } else {
              setPostPaymentLoading(false);
            }
          } else {
            setPostPaymentLoading(false);
          }
        })
        .catch(() => setPostPaymentLoading(false));
      return;
    } else if (proceedToCheckout && urlAddress) {
      // Returning from magic link auth — go straight to Stripe checkout (no analysis needed yet)
      setRedirectingToCheckout(true);
      window.history.replaceState({}, '', window.location.pathname);
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: urlAddress,
                industry: urlIndustry || 'dental',
                lat: parseFloat(params.get('lat')) || 0,
                lon: parseFloat(params.get('lon')) || 0,
              }),
            })
              .then((res) => res.json())
              .then((checkout) => {
                if (checkout.url) window.location.href = checkout.url;
              });
          }
        });
    } else if (!urlAddress && !sessionId && !reportId && !result) {
      // No valid parameters — redirect to homepage
      window.location.href = '/';
      return;
    } else if (urlAddress && !result) {
      // Fresh analysis from home page
      const ind = urlIndustry || 'dental';
      setAddress(urlAddress);
      setIndustry(ind);
      setLoading(true);
      fetch(`/api/analyze?address=${encodeURIComponent(urlAddress)}&industry=${encodeURIComponent(ind)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            pendingResultRef.current = { data, address: urlAddress, industry: ind };
          } else {
            setError(data?.error || 'Analysis failed');
            setLoading(false);
          }
        })
        .catch(() => { setError('Failed to connect. Please try again.'); setLoading(false); });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUnlock = async () => {
    if (!result) return;
    track('unlock_clicked', { address: result.address, industry, score: result.score });
    // If not logged in, show email modal
    if (!user) {
      setShowAuthModal(true);
      setAuthStep('email');
      return;
    }
    // If logged in, go straight to Stripe
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: result.address,
          industry,
          lat: result.lat,
          lon: result.lon,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError('Failed to initiate checkout. Please try again.');
    }
  };

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    if (!authEmail.includes('@') || !result) return;
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          address: result.address,
          industry,
          lat: result.lat,
          lon: result.lon,
        }),
      });
      const data = await res.json();
      if (data.sent) {
        setAuthStep('sent');
      } else {
        setError('Failed to send login link. Please try again.');
        setShowAuthModal(false);
      }
    } catch (e) {
      setError('Failed to send login link. Please try again.');
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.location = '/';
  };

  const isLocked = reportAccess === 'preview';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCompPage(0);
    setCheckedSteps({});

    try {
      const res = await fetch(`/api/analyze?address=${encodeURIComponent(address)}&industry=${industry}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreTier = (score) => {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'moderate';
    if (score >= 25) return 'challenging';
    return 'poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Strong Expansion Target';
    if (score >= 50) return 'Conditional Opportunity';
    if (score >= 25) return 'High Risk Location';
    return 'High Risk Location';
  };

  const anchorIcons = config.anchorIcons;

  if (postPaymentLoading) {
    return (
      <div className="post-payment-loading">
        <div className="post-payment-loading-inner">
          <div className="brand" style={{ marginBottom: '2rem', opacity: 0.5 }}>ExpansionLens</div>
          <div className="fullscreen-spinner" />
          <div className="post-payment-title">Preparing Your Report</div>
          <div className="post-payment-subtitle">Payment confirmed. We're generating your full analysis now...</div>
        </div>
      </div>
    );
  }

  if (redirectingToCheckout) {
    return (
      <div className="post-payment-loading">
        <div className="post-payment-loading-inner">
          <div className="brand" style={{ marginBottom: '2rem', opacity: 0.5 }}>ExpansionLens</div>
          <div className="fullscreen-spinner" />
          <div className="post-payment-title">Just a moment...</div>
          <div className="post-payment-subtitle">Redirecting you to secure checkout.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewingSaved ? (
        <header className="header header-saved">
          <div className="header-saved-inner">
            <a href="/" className="header-saved-brand"><img src="/images/logomark.png" alt="" className="header-saved-logomark" />ExpansionLens</a>
            {isSample ? (
              <a href="/" className="header-saved-back" onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.location = '/'; }}>&#8592; Analyze a Location</a>
            ) : (
              <a href="/dashboard" className="header-saved-back" onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.location = '/dashboard'; }}>&#8592; Back to Dashboard</a>
            )}
          </div>
        </header>
      ) : (
        <header className="header header-saved">
          <div className="header-saved-inner">
            <a href="/" className="header-saved-brand"><img src="/images/logomark.png" alt="" className="header-saved-logomark" />ExpansionLens</a>
            <div className="header-saved-right">
              <a href={user ? '/analyze' : '/'} className="header-saved-back" onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.location = user ? '/analyze' : '/'; }}>&#8592; Analyze Another Location</a>
              {user && (
                <>
                  <span className="header-saved-sep">|</span>
                  <a href="/dashboard" className="header-saved-back" onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.location = '/dashboard'; }}>My Reports</a>
                  <span className="header-saved-sep">|</span>
                  <button className="header-saved-back" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Log out</button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {error && <div className="error">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="loading-header">
            <div className="loading-header-top">
              <div className="loading-header-left">
                <div className="spinner" />
                <div className="loading-title">Analyzing Location</div>
              </div>
              <div className="loading-time-estimate">This usually takes 10–15 seconds</div>
            </div>
            <div className="loading-value-anchor">Building your expansion analysis (competition, demand, and revenue potential)</div>
            <div className="loading-subtitle">{loadingSteps[loadingStep]}</div>
          </div>
          <div className="loading-progress-track">
            <div className="loading-progress-fill" style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }} />
          </div>
          <div className="loading-grid">
            {loadingSteps.map((step, i) => {
              const state = i < loadingStep ? 'done' : i === loadingStep ? 'active' : 'pending';
              const isFull = i >= loadingSteps.length - 5;
              const hasPercent = i >= loadingSteps.length - 5;
              // Duration for each percentage step based on gap to next step
              const stepDelays = [300, 600, 900, 1300, 1700, 2100, 2500, 2900, 3400, 3900, 4400, 5000, 5800, 7500, 9200, 11000, 12800];
              const stepDuration = i < stepDelays.length - 1 ? stepDelays[i + 1] - stepDelays[i] : 2000;
              return (
                <div key={i} className={`loading-tile ${state}${isFull ? ' loading-tile-full' : ''}`}>
                  <span className="loading-tile-icon">
                    {state === 'done' ? (
                      <svg viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : state === 'active' ? (
                      <span className="loading-tile-spinner" />
                    ) : (
                      <span className="loading-tile-dot" />
                    )}
                  </span>
                  <span className="loading-tile-text">{step.replace('...', '')}</span>
                  {hasPercent && (
                    <span className="loading-tile-percent">
                      {state === 'done' ? '100%' : state === 'active' ? <LoadingPercent duration={stepDuration} /> : '0%'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result && (() => {
        const ratio = result.competitorCount > 0
          ? Math.round(result.population / (result.competitorCount + 1))
          : null;
        const reportId = `EIQ-${Date.now().toString(36).toUpperCase()}`;
        const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Per-render watermark. Encodes user identity, address signature,
        // and score so that if a clone surfaces with the same string in its
        // markup, the leak is traceable to a specific viewer.
        const userTag = user?.id ? user.id.slice(-6) : 'g';
        const addrTag = (result.address || '').length.toString(36);
        const scoreTag = (result.score ?? 0).toString(36);
        const wmark = `${userTag}.${addrTag}.${scoreTag}.${reportId.slice(-6)}`;

        return (
        <div className="report-layout" data-wm={wmark}>
          {/* watermark */}
          <span style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">{wmark}</span>
          <nav className={`report-nav${isLocked ? ' report-nav-locked' : ''}`}>
            {isLocked && <div className="report-nav-locked-trigger"><div className="report-nav-locked-tooltip">The score shown to the right only reflects high-level indicators. All insights included in this menu are included in the full report.</div></div>}

            {navSections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`report-nav-link${activeSection === id ? ' active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        <div className="report" data-wm={wmark}>
          {/* Report Header */}
          <div className="report-branding">
            <div className="report-branding-left">
              <div className="report-branding-logo">ExpansionLens</div>
              <div className="report-branding-subtitle">
                <span className="report-branding-title">Location Analysis Report</span>
                <span className="report-branding-meta">{reportDate} &middot; {reportId}</span>
              </div>
            </div>
            {!isLocked && (
              <button className="pdf-btn" onClick={async () => {
                const { default: html2pdf } = await import('html2pdf.js');
                const el = document.querySelector('.report');
                const checklist = document.getElementById('checklist');
                el.classList.add('pdf-exporting');
                if (checklist) checklist.style.display = 'none';
                html2pdf().set({
                  margin: [0.4, 0.4, 0.4, 0.4],
                  filename: 'ExpansionLens-Report.pdf',
                  image: { type: 'jpeg', quality: 0.95 },
                  html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
                }).from(el).save().then(() => {
                  if (checklist) checklist.style.display = '';
                  el.classList.remove('pdf-exporting');
                });
              }}>Export Report to PDF</button>
            )}
          </div>

          {/* Score Header — two columns */}
          <div id="score" className="score-header">
            <div className="score-header-left">
              <div className="address">{result.address}</div>
              <AnimatedScore score={result.score} tier={getScoreTier(result.score)} />
              <div className={`score-label ${getScoreTier(result.score)}`}>
                {getScoreLabel(result.score)}
              </div>
              <div className="address" style={{ fontStyle: 'italic' }}>Based on demographic demand and competitive density within a 3.5-mile radius</div>
            </div>

            {/* Score Breakdown */}
            {result.scoreBreakdown && (
              <div className="score-breakdown">
                <div className="breakdown-title">Score Breakdown</div>
                {result.scoreBreakdown.map((item) => (
                  <BreakdownRow key={item.label} item={item} tooltip={config.breakdownTooltips[item.label]} />
                ))}
              </div>
            )}
          </div>

          {/* Data accuracy disclaimer — visible on every report */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.875rem 1.125rem',
            margin: '0 0 1.5rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.78rem',
            lineHeight: 1.55,
            color: '#64748b',
          }}>
            <span style={{ fontSize: '0.95rem', lineHeight: 1, marginTop: '0.05rem', color: '#94a3b8' }}>ⓘ</span>
            <span>
              <strong style={{ color: '#475569' }}>Informational only.</strong> This report is generated from publicly available third-party data and does not guarantee business success. ExpansionLens is not liable for business decisions made based on this report. Always conduct independent due diligence before signing a lease or making a capital commitment.
            </span>
          </div>

          <GatedSection locked={isLocked} onUnlock={handleUnlock} industry={industry}>
          {/* Upside & Risks — pre-evaluated server-side, just render */}
          {(() => {
            const upside = result.upside || [];
            const risks = result.risks || [];

            return (
              <div id="upside-risks" className="upside-risks">
                <div className="upside-risks-col upside">
                  <h3 className="upside-risks-title"><span className="upside-risks-icon">▲</span> Upside</h3>
                  {upside.length > 0 ? upside.slice(0, 5).map((item, i) => (
                    <div key={i} className="upside-risks-item">
                      <span className="upside-risks-bullet upside" />
                      <div>
                        <div className="upside-risks-text">{item.text}</div>
                        <div className="upside-risks-detail">{item.detail}</div>
                      </div>
                    </div>
                  )) : <div className="upside-risks-empty">No significant upsides identified</div>}
                </div>
                <div className="upside-risks-col risks">
                  <h3 className="upside-risks-title"><span className="upside-risks-icon">▼</span> Risks</h3>
                  {risks.length > 0 ? risks.slice(0, 5).map((item, i) => (
                    <div key={i} className="upside-risks-item">
                      <span className="upside-risks-bullet risks" />
                      <div>
                        <div className="upside-risks-text">{item.text}</div>
                        <div className="upside-risks-detail">{item.detail}</div>
                      </div>
                    </div>
                  )) : <div className="upside-risks-empty">No significant risks identified</div>}
                </div>
              </div>
            );
          })()}

          {/* Market Capacity — pre-derived server-side */}
          {result.marketCapacity && (() => {
            const mc = result.marketCapacity;
            return (
              <div id="market-capacity" className="market-capacity">
                <div className="market-capacity-icon">$</div>
                <div className="market-capacity-content">
                  <div className="market-capacity-label">{mc.title}</div>
                  <div className="market-capacity-stat">
                    {mc.stat}
                    <span className="market-capacity-unit">{mc.unit}</span>
                  </div>
                  <div className="market-capacity-detail">{mc.detail}</div>
                </div>
              </div>
            );
          })()}

          {/* What It Takes to Win Here — pre-derived server-side */}
          {(() => {
            const strategies = result.winStrategy || [];
            return (
              <div id="win-strategy" className="win-strategy">
                <h2 className="win-strategy-title">What It Takes to Win Here</h2>
                <ul className="win-strategy-list">
                  {strategies.map((item, i) => (
                    <li key={i} className="win-strategy-item">
                      <span className="win-strategy-marker" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Map */}
          <div id="map" className="map-container">
            <div className="map-header">
              <h2>Competitive Landscape</h2>
              <div className="map-legend">
                <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} />Low Opportunity</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} />Moderate</span>
                <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} />High Opportunity</span>
              </div>
            </div>
            <div className="map-wrapper">
              <Map
                lat={result.lat}
                lon={result.lon}
                competitors={result.competitors}
                population={result.population}
                medianIncome={result.medianIncome}
                industry={industry}
              />
            </div>
          </div>

          {/* Competitive Insight */}
          {result.avgCompetitorRating != null && (
            <div id="competitive-insight" className="quality-callout">
              <h2 className="quality-callout-title">Competitive Insight</h2>
              <div className="quality-rating">
                <span className="quality-stars">{'★'.repeat(Math.round(result.avgCompetitorRating))}{'☆'.repeat(5 - Math.round(result.avgCompetitorRating))}</span>
                <span className="quality-number">{result.avgCompetitorRating}</span>
              </div>
              <div className="quality-text">
                Average competitor rating across {result.totalCompetitorReviews?.toLocaleString()} reviews
                {result.avgCompetitorRating >= 4.5 ? ' — well-established competitors, differentiation is key' :
                 result.avgCompetitorRating < 3.5 ? ' — quality gap presents a clear opportunity' :
                 ' — moderate competitor quality'}
              </div>
              <div className="quality-tip">
                <span className="quality-tip-label">Tip:</span>
                {result.avgCompetitorRating >= 4.5
                  ? config.qualityTipTiers.excellent(result.avgCompetitorRating)
                  : result.avgCompetitorRating >= 4.0
                  ? config.qualityTipTiers.good(result.avgCompetitorRating)
                  : result.avgCompetitorRating >= 3.5
                  ? config.qualityTipTiers.average(result.avgCompetitorRating)
                  : config.qualityTipTiers.poor(result.avgCompetitorRating)
                }
              </div>
            </div>
          )}

          {/* Key Metrics — Row 1 */}
          <div id="key-metrics" className="metrics-grid">
            <MetricCard
              label="Competitors"
              value={result.competitorCount}
              detail="within 3.5 miles"
              tooltip={config.metricTooltips.competitors}
            />
            <MetricCard
              label="Population"
              value={fmt(result.population)}
              detail="census tract"
              tooltip={config.metricTooltips.population}
            />
            <MetricCard
              label="Median Income"
              value={fmt(result.medianIncome, '$')}
              detail="household"
              tooltip={config.metricTooltips.income}
            />
          </div>

          {/* Key Metrics — Row 2 */}
          <div className="metrics-grid">
            <MetricCard
              label="Walk Score"
              value={result.walkScore ? result.walkScore.walkScore : 'N/A'}
              detail={result.walkScore?.walkDescription || 'not available'}
              tooltip={config.metricTooltips.walkScore}
            />
            <MetricCard
              label="Employment Rate"
              value={fmt(result.employmentRate, '', '%')}
              detail="labor force"
              tooltip={config.metricTooltips.employment}
            />
            <MetricCard
              label="Pop Growth"
              value={result.popGrowth != null ? `${result.popGrowth > 0 ? '+' : ''}${result.popGrowth}%` : 'N/A'}
              detail="county year-over-year"
              tooltip={config.metricTooltips.growth}
            />
          </div>

          {/* Demographics Detail */}
          <div id="demographics" className="detail-card">
            <h2>Demographic Profile</h2>
            <div className="detail-grid">
              <DemoItem label="Median Age" value={result.medianAge != null ? `${result.medianAge} years` : 'N/A'} tooltip={config.demoTooltips['Median Age']} />
              <DemoItem label="College Educated" value={fmt(result.collegePercent, '', '%')} tooltip={config.demoTooltips['College Educated']} />
              <DemoItem label="Median Home Value" value={fmt(result.medianHomeValue, '$')} tooltip={config.demoTooltips['Median Home Value']} />
              <DemoItem label="Vacancy Rate" value={fmt(result.vacancyRate, '', '%')} tooltip={config.demoTooltips['Vacancy Rate']} />
              <DemoItem label="Drive to Work" value={fmt(result.drivePercent, '', '%')} tooltip={config.demoTooltips['Drive to Work']} />
              <DemoItem label="Transit Score" value={result.walkScore?.transitScore ?? 'N/A'} tooltip={config.demoTooltips['Transit Score']} />
            </div>
          </div>

          {/* Nearby Anchors */}
          {result.anchors && (
            <div id="anchors" className="detail-card">
              <h2>Nearby Points of Interest</h2>
              <div className="anchors-grid">
                {Object.entries(result.anchors).map(([category, data]) => (
                  <div key={category} className="anchor-item">
                    <span className="anchor-icon">{anchorIcons[category] || '📍'}</span>
                    <div className="anchor-info">
                      <span className="anchor-count">{data.count}</span>
                      <span className="anchor-label">{category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div id="summary" className="summary-card">
            <h2>Analysis Summary</h2>
            <p>{result.summary}</p>
          </div>

          {/* Daytime Workforce — Census LEHD QWI county-level data (dental only) */}
          {result.daytimeWorkforce && result.daytimeWorkforce.totalJobs > 0 && (() => {
            const wf = result.daytimeWorkforce;
            const ratio = wf.workerToResidentRatio;
            const top = wf.topIndustries || [];
            const topInd = top[0];
            const fmtJobs = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);

            // Market type signal: ratio > 0.6 = job importer, < 0.4 = bedroom community
            let marketType = 'mixed';
            if (ratio != null) {
              if (ratio >= 0.6) marketType = 'commuter';
              else if (ratio < 0.4) marketType = 'residential';
            }

            // "Why this matters" qualifier — punchy one-line summary distilled
            // from market type + dominant industry
            const code = topInd?.code;
            let qualifier = 'Balanced market — both residential and commuter patterns work';
            if (marketType === 'commuter') {
              if (code === '62') qualifier = 'Healthcare-cluster commuter market — referral pipeline goldmine';
              else if (code === '51') qualifier = 'Tech-driven commuter market — premium positioning fits the demographic';
              else if (code === '54') qualifier = 'White-collar commuter market — strong cosmetic and elective potential';
              else if (code === '52') qualifier = 'Finance-driven commuter market — high case-acceptance demographic';
              else if (code === '61') qualifier = 'Education-anchored commuter market — stable, recurring demand';
              else qualifier = 'Commuter market — daytime workforce expands the patient pool beyond residents';
            } else if (marketType === 'residential') {
              if (code === '62') qualifier = 'Healthcare-anchored residential market — physician referral channel available';
              else if (code === '54') qualifier = 'Residential professional market — family practice plus elective work';
              else if (code === '31-33') qualifier = 'Working-class residential market — value positioning and family practice';
              else qualifier = 'Residential market — family practice with evening and weekend hours wins';
            } else {
              if (code === '62') qualifier = 'Balanced market with healthcare cluster anchor';
              else if (code === '54') qualifier = 'Balanced professional market — broad patient appeal';
            }

            return (
              <div id="daytime-workforce" className="daytime-workforce">
                <div className="daytime-workforce-header">
                  <h2>Daytime Workforce</h2>
                  <span className="powered-by">Sourced from U.S. Census Bureau LEHD QWI &middot; {wf.quarter}</span>
                </div>

                <div className="workforce-stat-grid">
                  <div className="workforce-stat">
                    <div className="workforce-stat-value">{fmtJobs(wf.totalJobs)}</div>
                    <div className="workforce-stat-label">Daytime Jobs</div>
                    <div className="workforce-stat-sub">in this county</div>
                  </div>
                  <div className="workforce-stat">
                    <div className="workforce-stat-value">{ratio != null ? `${ratio.toFixed(2)}×` : 'N/A'}</div>
                    <div className="workforce-stat-label">Worker / Resident</div>
                    <div className="workforce-stat-sub">{marketType === 'commuter' ? 'job importer' : marketType === 'residential' ? 'residential market' : 'mixed market'}</div>
                  </div>
                  <div className="workforce-stat">
                    <div className="workforce-stat-value" style={{ fontSize: '1.05rem', fontFamily: 'inherit', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2, paddingTop: '0.4rem' }}>{topInd ? topInd.label : 'N/A'}</div>
                    <div className="workforce-stat-label">Top Industry</div>
                    <div className="workforce-stat-sub">{topInd ? `${topInd.percent}% of jobs` : ''}</div>
                  </div>
                  <div className="workforce-stat">
                    <div className="workforce-stat-value">{wf.avgMonthlyEarnings ? `$${(wf.avgMonthlyEarnings * 12 / 1000).toFixed(0)}K` : 'N/A'}</div>
                    <div className="workforce-stat-label">Avg Annual Earnings</div>
                    <div className="workforce-stat-sub">across all sectors</div>
                  </div>
                </div>

                {top.length > 0 && (
                  <div className="workforce-industry-row">
                    <div className="workforce-industry-title">Top Employer Industries</div>
                    <div className="workforce-industry-chips">
                      {top.map((ind) => (
                        <span key={ind.code} className="workforce-chip">
                          <strong>{fmtJobs(ind.jobs)}</strong> {ind.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="workforce-insight">
                  <strong>Insight:</strong>{' '}
                  Federal LEHD data shows {wf.totalJobs.toLocaleString()} jobs in this county across {top.length} major industries.{' '}
                  {marketType === 'commuter' && (
                    <>The worker-to-resident ratio of <strong>{ratio.toFixed(2)}&times;</strong> means more people work here than live here &mdash; this is a job-importing market that pulls commuters from neighboring counties. A dental practice targeting downtown professionals with extended weekday hours and lunch-hour appointment slots can capture this daytime workforce on top of the residential patient base. </>
                  )}
                  {marketType === 'residential' && (
                    <>The worker-to-resident ratio of <strong>{ratio.toFixed(2)}&times;</strong> indicates a residential / bedroom-community market &mdash; most patients will be local residents, not workday commuters. A family practice with evening and weekend hours will outperform a downtown professional model here. </>
                  )}
                  {marketType === 'mixed' && (
                    <>The worker-to-resident ratio of <strong>{ratio.toFixed(2)}&times;</strong> suggests a balanced market that supports both residential and workday-focused practice models. </>
                  )}
                  {topInd && topInd.code === '54' && (
                    <>Professional Services dominates the workforce at <strong>{topInd.percent}%</strong> &mdash; this is a high-income, high-case-acceptance segment. Premium cosmetic and elective dental work is well-supported here. </>
                  )}
                  {topInd && topInd.code === '62' && (
                    <>Healthcare &amp; Social Assistance dominates the workforce at <strong>{topInd.percent}%</strong> &mdash; medical-cluster proximity creates referral opportunities. Build relationships with nearby hospitals and physician practices for new-patient acquisition. </>
                  )}
                  {topInd && topInd.code === '51' && (
                    <>Information &amp; Tech dominates at <strong>{topInd.percent}%</strong> &mdash; tech employers typically offer strong dental insurance benefits and high disposable income. PPO-credentialed practices targeting these workers will see strong elective procedure demand. </>
                  )}
                  {topInd && topInd.code === '52' && (
                    <>Finance &amp; Insurance dominates at <strong>{topInd.percent}%</strong> &mdash; another high-income white-collar segment with strong employer dental benefits. </>
                  )}
                  {wf.countyMedianIncome && wf.countyMedianIncome >= 80000 && (
                    <>County median household income of <strong>${wf.countyMedianIncome.toLocaleString()}</strong> reinforces the high-income profile across both residents and workers. </>
                  )}
                </div>

                <div className="section-qualifier">
                  <span className="section-qualifier-label">Why this matters</span>
                  <span className="section-qualifier-text">{qualifier}</span>
                </div>
              </div>
            );
          })()}

          {/* Payer Mix & Coverage — Census ACS + state Medicaid lookup (dental only) */}
          {result.payerMix && (result.payerMix.privateRate != null || result.payerMix.medicaid) && (() => {
            const pm = result.payerMix;
            const md = pm.medicaid;
            const np = result.npiData;
            const tierColor = md ? ({
              extensive: '#10b981',
              limited: '#f59e0b',
              emergency: '#ef4444',
              none: '#7f1d1d',
            }[md.tier] || '#64748b') : '#64748b';

            // "Why this matters" qualifier — punchy one-line summary distilled
            // from private insurance penetration + state Medicaid tier
            const priv = pm.privateRate;
            const pub = pm.publicRate;
            const tier = md ? md.tier : null;
            let pmQualifier = 'Mixed payer market — multi-channel approach recommended';
            if (priv != null && priv >= 75 && tier === 'extensive') {
              pmQualifier = 'Strong PPO market with viable Medicaid pathway — credentialing pays off both ways';
            } else if (priv != null && priv >= 75) {
              pmQualifier = 'PPO-driven market — focus on insured patients and self-pay, Medicaid is supplementary';
            } else if (priv != null && priv >= 55 && priv < 75 && tier === 'extensive') {
              pmQualifier = 'Mixed payer market with strong Medicaid viability — broad credentialing strategy';
            } else if (priv != null && priv >= 55 && priv < 75) {
              pmQualifier = 'Hybrid market — PPO and self-pay segments are both viable revenue channels';
            } else if (pub != null && pub >= 30 && tier === 'extensive') {
              pmQualifier = 'Medicaid-heavy market — credentialing is critical and economically viable';
            } else if (pub != null && pub >= 30) {
              pmQualifier = 'Public coverage dominant — Medicaid revenue is limited by state benefit tier';
            } else if (priv != null && priv < 55 && tier === 'extensive') {
              pmQualifier = 'Self-pay plus Medicaid market — credentialing pays off in this state';
            } else if (priv != null && priv < 55) {
              pmQualifier = 'Self-pay market — in-house membership plans and transparent pricing win here';
            }

            return (
              <div id="payer-mix" className="payer-mix">
                <div className="payer-mix-header">
                  <h2>Payer Mix &amp; Coverage</h2>
                  <span className="powered-by">Sourced from U.S. Census ACS &middot; CHCS Medicaid tracker</span>
                </div>

                <div className="payer-stat-grid">
                  <div className="payer-stat">
                    <div className="payer-stat-value">{pm.privateRate != null ? `${pm.privateRate}%` : 'N/A'}</div>
                    <div className="payer-stat-label">Private Insurance</div>
                    <div className="payer-stat-sub">proxy for employer dental</div>
                  </div>
                  <div className="payer-stat">
                    <div className="payer-stat-value">{pm.publicRate != null ? `${pm.publicRate}%` : 'N/A'}</div>
                    <div className="payer-stat-label">Public Coverage</div>
                    <div className="payer-stat-sub">Medicaid &amp; Medicare</div>
                  </div>
                  <div className="payer-stat">
                    <div className="payer-stat-value">{pm.uninsuredRate != null ? `${pm.uninsuredRate}%` : 'N/A'}</div>
                    <div className="payer-stat-label">Uninsured</div>
                    <div className="payer-stat-sub">self-pay or skip care</div>
                  </div>
                  <div className="payer-stat">
                    <div className="payer-stat-value" style={{ color: tierColor, fontSize: '1.05rem', fontFamily: 'inherit', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.2, paddingTop: '0.4rem' }}>{md ? md.label : 'N/A'}</div>
                    <div className="payer-stat-label">Adult Medicaid Dental</div>
                    <div className="payer-stat-sub">state benefit tier</div>
                  </div>
                </div>

                <div className="payer-insight">
                  <strong>Insight:</strong>{' '}
                  {pm.privateRate != null && pm.privateRate >= 75 && (
                    <>This is a high private-insurance market &mdash; <strong>{pm.privateRate}%</strong> of residents carry private health coverage, which strongly correlates with employer-sponsored dental benefits. PPO-friendly practices accepting major carriers (Delta Dental, Cigna, Aetna, MetLife) will see the largest addressable patient pool. </>
                  )}
                  {pm.privateRate != null && pm.privateRate >= 55 && pm.privateRate < 75 && (
                    <>Private insurance coverage is moderate at <strong>{pm.privateRate}%</strong> &mdash; the market supports both PPO-network practices and a meaningful self-pay segment. Consider in-house membership plans alongside major-carrier credentialing. </>
                  )}
                  {pm.privateRate != null && pm.privateRate < 55 && (
                    <>Private insurance coverage is below average at <strong>{pm.privateRate}%</strong>. This market skews toward public coverage and self-pay &mdash; in-house membership plans, transparent fee schedules, and financing options will outperform a PPO-heavy model. </>
                  )}
                  {pm.publicRate != null && pm.publicRate >= 30 && (
                    <>Public coverage runs <strong>{pm.publicRate}%</strong>, well above the national average. </>
                  )}
                  {md && md.tier === 'extensive' && (
                    <>Adult Medicaid dental in this state is <strong>extensive</strong> &mdash; preventive, restorative, and most major procedures are covered, making Medicaid patients economically viable. A Medicaid-credentialed practice can build a stable patient base in this market. </>
                  )}
                  {md && md.tier === 'limited' && (
                    <>Adult Medicaid dental in this state is <strong>limited</strong> &mdash; preventive cleanings and basic restorative are typically covered, but annual benefit caps mean larger cases require self-pay or financing. Medicaid is a viable channel but not a primary one. </>
                  )}
                  {md && md.tier === 'emergency' && (
                    <>Adult Medicaid dental in this state is <strong>emergency-only</strong> &mdash; coverage is limited to extractions and pain relief. A Medicaid-focused model is not economically viable for adult patients in this market. </>
                  )}
                  {md && md.tier === 'none' && (
                    <>This state has <strong>no adult Medicaid dental coverage</strong>. Medicaid enrollees pay out of pocket or skip dental care entirely &mdash; the addressable adult market for a Medicaid-credentialed practice is essentially zero. </>
                  )}
                  {pm.uninsuredRate != null && pm.uninsuredRate >= 12 && (
                    <>The uninsured rate of <strong>{pm.uninsuredRate}%</strong> is meaningful &mdash; consider offering an in-house membership plan ($25&ndash;$40/mo) to convert these patients into recurring revenue. </>
                  )}
                  {np && pm.privateRate != null && np.specialists > 0 && pm.privateRate >= 70 && (
                    <>Combined with NPI data showing {np.specialists} specialist{np.specialists === 1 ? '' : 's'} in this ZIP, the high private-insurance population creates a viable market for premium specialty work (cosmetic, implants, full-mouth restoration). </>
                  )}
                </div>

                <div className="section-qualifier">
                  <span className="section-qualifier-label">Why this matters</span>
                  <span className="section-qualifier-text">{pmQualifier}</span>
                </div>
              </div>
            );
          })()}

          {/* Provider Landscape — NPI Registry data (dental only) */}
          {result.npiData && result.npiData.totalProviders > 0 && (() => {
            const np = result.npiData;
            const bs = np.bySpecialty || {};
            const gpCount = result.competitorCount || 0;
            const delta = np.totalProviders - gpCount;
            const specialtyGaps = [];
            if ((bs.pediatric || 0) === 0) specialtyGaps.push('pediatric dentistry');
            if ((bs.orthodontics || 0) === 0) specialtyGaps.push('orthodontics');
            if ((bs.oralSurgery || 0) === 0) specialtyGaps.push('oral surgery');
            if ((bs.endodontics || 0) === 0) specialtyGaps.push('endodontics');
            if ((bs.periodontics || 0) === 0) specialtyGaps.push('periodontics');

            // "Why this matters" qualifier — distilled from specialty gaps,
            // market growth (new providers in 24mo), and solo vs DSO mix
            const newProvs = np.newProviders24mo || 0;
            const soloRate = np.soloProprietorRate || 0;
            const totalProvs = np.totalProviders || 0;
            const numGaps = specialtyGaps.length;
            let plQualifier = 'Established dental market — differentiate through experience and technology';
            if (numGaps >= 2 && newProvs >= 5) {
              plQualifier = `Growing market with multiple specialty gaps — clear opening for ${specialtyGaps[0]} or ${specialtyGaps[1]}`;
            } else if (numGaps >= 2) {
              plQualifier = `Specialty-gap market — open lane for ${specialtyGaps[0]} and ${specialtyGaps[1]}`;
            } else if (numGaps === 1 && newProvs >= 5) {
              plQualifier = `Growing market with a ${specialtyGaps[0]} gap — move quickly before competitors fill it`;
            } else if (numGaps === 1) {
              plQualifier = `Single specialty gap — clear opportunity for a ${specialtyGaps[0]} practice`;
            } else if (newProvs >= 8) {
              plQualifier = 'Rapidly growing market — multiple new entrants in the last 24 months';
            } else if (newProvs >= 5) {
              plQualifier = 'Active growth market — competitors arriving, move quickly to establish';
            } else if (newProvs === 0 && totalProvs < 10) {
              plQualifier = 'Underserved market — low provider density and no recent new entrants';
            } else if (newProvs === 0) {
              plQualifier = 'Mature market — incumbents are entrenched, differentiation is critical';
            } else if (soloRate < 30) {
              plQualifier = 'DSO-dominated market — independent positioning is your differentiator';
            } else if (soloRate >= 50) {
              plQualifier = 'Independent-friendly market — DSO consolidation has not reached here yet';
            }

            return (
              <div id="provider-landscape" className="provider-landscape">
                <div className="provider-landscape-header">
                  <h2>Local Dental Provider Landscape</h2>
                  <span className="powered-by">Sourced from CMS NPI Registry</span>
                </div>

                <div className="provider-stat-grid">
                  <div className="provider-stat">
                    <div className="provider-stat-value">{np.totalProviders}</div>
                    <div className="provider-stat-label">Licensed Dentists</div>
                    <div className="provider-stat-sub">{np.scope === 'city' ? `in ${np.scopeLabel}` : `in ZIP ${np.scopeLabel || np.zip}`}</div>
                  </div>
                  <div className="provider-stat">
                    <div className="provider-stat-value">{np.generalists}</div>
                    <div className="provider-stat-label">General Practice</div>
                    <div className="provider-stat-sub">{np.totalProviders > 0 ? Math.round((np.generalists / np.totalProviders) * 100) : 0}% of providers</div>
                  </div>
                  <div className="provider-stat">
                    <div className="provider-stat-value">{np.specialists}</div>
                    <div className="provider-stat-label">Specialists</div>
                    <div className="provider-stat-sub">ortho, pedo, oral surgery, etc.</div>
                  </div>
                  <div className="provider-stat">
                    <div className="provider-stat-value">{np.newProviders24mo}</div>
                    <div className="provider-stat-label">New (24 mo)</div>
                    <div className="provider-stat-sub">{np.newProviders24mo > 0 ? 'recently registered' : 'no recent entries'}</div>
                  </div>
                </div>

                <div className="provider-specialty-row">
                  <div className="provider-specialty-title">Specialty Coverage</div>
                  <div className="provider-specialty-chips">
                    {bs.orthodontics > 0 && <span className="provider-chip">{bs.orthodontics}× Orthodontics</span>}
                    {bs.pediatric > 0 && <span className="provider-chip">{bs.pediatric}× Pediatric</span>}
                    {bs.oralSurgery > 0 && <span className="provider-chip">{bs.oralSurgery}× Oral Surgery</span>}
                    {bs.endodontics > 0 && <span className="provider-chip">{bs.endodontics}× Endodontics</span>}
                    {bs.periodontics > 0 && <span className="provider-chip">{bs.periodontics}× Periodontics</span>}
                    {bs.prosthodontics > 0 && <span className="provider-chip">{bs.prosthodontics}× Prosthodontics</span>}
                    {bs.publicHealth > 0 && <span className="provider-chip">{bs.publicHealth}× Public Health</span>}
                    {specialtyGaps.length > 0 && (
                      <span className="provider-chip provider-chip-gap">No: {specialtyGaps.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="provider-insight">
                  <strong>Insight:</strong>{' '}
                  Federal NPI Registry data shows {np.totalProviders} licensed dentists {np.scope === 'city' ? `in ${np.scopeLabel}` : `in ZIP ${np.scopeLabel || np.zip}`} ({np.generalists} general practice, {np.specialists} specialists).{' '}
                  {np.newProviders24mo >= 5 && (
                    <>The {np.newProviders24mo} newly-registered dentists in the last 24 months indicate an actively expanding professional base &mdash; both a rising-demand signal and a sign that more competitors will arrive in the coming year. </>
                  )}
                  {np.newProviders24mo > 0 && np.newProviders24mo < 5 && (
                    <>{np.newProviders24mo} new provider registration{np.newProviders24mo === 1 ? '' : 's'} in the last 24 months shows modest market entry activity. </>
                  )}
                  {np.newProviders24mo === 0 && (
                    <>Zero new provider registrations in the last 24 months suggests a mature, slower-moving market &mdash; either saturated with established players or genuinely underserved with no new entrants taking the opportunity. </>
                  )}
                  {specialtyGaps.length >= 2 && (
                    <>The absence of {specialtyGaps.slice(0, 2).join(' and ')} in this ZIP is a clear opportunity for a specialty-focused practice or a general practice that adds these services in-house. </>
                  )}
                  {specialtyGaps.length === 1 && (
                    <>The absence of {specialtyGaps[0]} in this ZIP could be an opportunity for a specialty-focused practice. </>
                  )}
                  {np.soloProprietorRate >= 50 && (
                    <>{np.soloProprietorRate}% of providers are sole proprietors &mdash; this market is dominated by independent practices, not group/DSO operators.</>
                  )}
                  {np.soloProprietorRate < 30 && (
                    <>Only {np.soloProprietorRate}% of providers are sole proprietors &mdash; this market is dominated by group practices and DSO operators.</>
                  )}
                  {np.soloProprietorRate >= 30 && np.soloProprietorRate < 50 && (
                    <>{np.soloProprietorRate}% of providers are sole proprietors &mdash; a mixed market of independent practices and group/DSO operators.</>
                  )}
                </div>

                <div className="section-qualifier">
                  <span className="section-qualifier-label">Why this matters</span>
                  <span className="section-qualifier-text">{plQualifier}</span>
                </div>
              </div>
            );
          })()}

          {/* Competitor Breakdown */}
          {result.competitors.length > 0 && (() => {
            const PER_PAGE = 10;
            const sorted = result.competitors
              .map((comp) => ({
                ...comp,
                distance: getDistanceMiles(result.lat, result.lon, comp.lat, comp.lon),
              }))
              .sort((a, b) => a.distance - b.distance);
            const totalPages = Math.ceil(sorted.length / PER_PAGE);
            const page = Math.min(compPage, totalPages - 1);
            const paged = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

            return (
              <div id="competitors" className="competitors-table-card">
                <div className="competitors-table-header">
                  <h2>Nearby {config.competitorLabel} ({result.competitorCount})</h2>
                  {result.avgCompetitorRating != null && <span className="powered-by">Ratings powered by Google</span>}
                </div>
                <div className="table-wrapper">
                  <table className="competitors-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Practice Name</th>
                        <th>Rating</th>
                        <th>Address</th>
                        <th>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((comp, i) => (
                        <tr key={page * PER_PAGE + i}>
                          <td className="row-num">{page * PER_PAGE + i + 1}</td>
                          <td className="practice-name">
                            <span className="tooth-icon">{industry === 'bars' ? '🍸' : '🦷'}</span>
                            {comp.name}
                          </td>
                          <td className="practice-rating">
                            {comp.rating != null ? (
                              <><span className="star">★</span> {comp.rating} <a
                                href={comp.googlePlaceId
                                  ? `https://www.google.com/maps/place/?q=place_id:${comp.googlePlaceId}`
                                  : `https://www.google.com/maps/search/${encodeURIComponent(comp.name)}/@${comp.lat},${comp.lon},17z`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="review-link"
                              >({comp.reviewCount})</a></>
                            ) : '—'}
                          </td>
                          <td className="practice-address">{comp.address || '—'}</td>
                          <td className="practice-distance">{comp.distance.toFixed(1)} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-arrow"
                      disabled={page === 0}
                      onClick={() => setCompPage(page - 1)}
                      aria-label="Previous page"
                    >‹</button>
                    <div className="pagination-dots">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          className={`pagination-dot${i === page ? ' active' : ''}`}
                          onClick={() => setCompPage(i)}
                          aria-label={`Page ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      className="pagination-arrow"
                      disabled={page === totalPages - 1}
                      onClick={() => setCompPage(page + 1)}
                      aria-label="Next page"
                    >›</button>
                    <span className="pagination-info">
                      {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, sorted.length)} of {sorted.length}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Execution Checklist — pre-derived server-side */}
          {result.score != null && result.nextSteps && (() => {
            const { immediate, shortTerm, strategic } = result.nextSteps;
            const allSteps = [...immediate, ...shortTerm, ...strategic];
            const totalCount = allSteps.length;
            const completedCount = allSteps.filter((_, i) => checkedSteps[i]).length;
            let idx = 0;

            const sections = [
              { key: 'immediate', label: 'Immediate', subtitle: 'This Week', items: immediate, accent: 'var(--danger)' },
              { key: 'shortTerm', label: 'Short-Term', subtitle: '1–2 Weeks', items: shortTerm, accent: 'var(--warning)' },
              { key: 'strategic', label: 'Strategic', subtitle: 'Ongoing', items: strategic, accent: 'var(--primary)' },
            ];

            return (
              <div id="checklist" className="next-steps-card">
                <div className="next-steps-header">
                  <h2>Execution Checklist</h2>
                  <button className="checklist-print-btn" onClick={async () => {
                    const { default: html2pdf } = await import('html2pdf.js');
                    const el = document.getElementById('checklist');
                    if (!el) return;
                    el.classList.add('pdf-exporting');
                    el.style.transform = 'scale(0.75)';
                    el.style.transformOrigin = 'top left';
                    el.style.width = '133.33%';
                    html2pdf().set({
                      margin: [0.3, 0.3, 0.3, 0.3],
                      filename: 'ExpansionLens-Checklist.pdf',
                      image: { type: 'jpeg', quality: 0.95 },
                      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                    }).from(el).save().then(() => {
                      el.style.transform = '';
                      el.style.transformOrigin = '';
                      el.style.width = '';
                      el.classList.remove('pdf-exporting');
                    });
                  }}>Export Checklist to PDF</button>
                </div>
                <div className="next-steps-subtitle">Optional: Use this as a guide to evaluate and validate this location before committing.</div>
                <div className="next-steps-bar-track">
                  <div
                    className="next-steps-bar-fill"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
                <div className="next-steps-sections">
                  {sections.map((section) => {
                    const sectionItems = section.items.map((text) => {
                      const globalIdx = idx++;
                      return { text, globalIdx };
                    });
                    return (
                      <div key={section.key} className="next-steps-section">
                        <div className="next-steps-section-header">
                          <span className="next-steps-section-dot" style={{ background: section.accent }} />
                          <span className="next-steps-section-label">{section.label}</span>
                          <span className="next-steps-section-subtitle">{section.subtitle}</span>
                        </div>
                        <ul className="next-steps-list">
                          {sectionItems.map(({ text, globalIdx }) => (
                            <li
                              key={globalIdx}
                              className={`next-step-item${checkedSteps[globalIdx] ? ' checked' : ''}`}
                              onClick={() => setCheckedSteps((prev) => ({ ...prev, [globalIdx]: !prev[globalIdx] }))}
                            >
                              <span className="next-step-checkbox" style={checkedSteps[globalIdx] ? { background: section.accent, borderColor: section.accent } : {}}>
                                {checkedSteps[globalIdx] && <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </span>
                              <span className="next-step-text">{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          </GatedSection>
        </div>
        </div>
        );
      })()}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>&times;</button>
            {authStep === 'email' ? (
              <>
                <div className="auth-modal-title">Enter your email to continue</div>
                <form onSubmit={handleSendMagicLink}>
                  <input
                    type="email"
                    className="auth-modal-input"
                    placeholder="your@email.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="submit" className="auth-modal-btn" disabled={authLoading || !authEmail.includes('@')}>
                    {authLoading ? 'Sending...' : 'Send Login Link'}
                  </button>
                </form>
                <div className="auth-modal-hint">We'll send you a secure login link. No password needed.</div>
              </>
            ) : (
              <>
                <div className="auth-modal-icon">&#9993;</div>
                <div className="auth-modal-title">Check Your Email!</div>
                <div className="auth-modal-desc">We've sent a confirmation link to <strong>{authEmail}</strong>. Please click the link in this email to access your report.</div>
                <button className="auth-modal-btn-secondary" onClick={() => setAuthStep('email')}>Resend Link</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
