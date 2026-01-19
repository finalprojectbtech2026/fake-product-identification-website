import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock
} from "react-icons/fa";

const Footer = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggleSection = (index) => setOpenIndex(openIndex === index ? null : index);

  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "About Clinic", to: "/about" },
    { label: "Treatments", to: "/treatments" },
    { label: "Book Appointment", to: "/contact" },
    { label: "Contact", to: "/contact" }
  ];

  const treatmentLinks = [
    { label: "Acne & Scar Care", to: "/treatments" },
    { label: "Pigmentation Care", to: "/treatments" },
    { label: "Hair & Scalp Care", to: "/treatments" },
    { label: "Laser & Aesthetic", to: "/treatments" },
    { label: "Skin Allergy Care", to: "/treatments" },
    { label: "Anti Aging Care", to: "/treatments" }
  ];

  const mobileSections = [
    {
      title: "Quick Links",
      type: "links",
      items: quickLinks
    },
    {
      title: "Treatments",
      type: "links",
      items: treatmentLinks
    },
    {
      title: "Clinic Info",
      type: "info",
      items: [
        {
          icon: <FaMapMarkerAlt />,
          text: "Tanvi Skin & Health Clinic, Srikakulam"
        },
        {
          icon: <FaClock />,
          text: "Mon - Sat: 9:00 AM - 8:00 PM"
        },
        {
          icon: <FaEnvelope />,
          text: "tanviskinhealth@gmail.com",
          href: "mailto:tanviskinhealth@gmail.com"
        },
        {
          icon: <FaPhoneAlt />,
          text: "+91 98765 43210",
          href: "tel:+919876543210"
        }
      ]
    }
  ];

  return (
    <footer className="clinicFooter">
      <div className="clinicFooterGlow"></div>

      <div className="clinicFooterInner">
        <div className="footerTop">
          <div className="footerBrand">
            <h2 className="footerLogo">Tanvi Skin & Health</h2>
            <p className="footerTagline">
              Dermatology and General Medicine care with safe treatments, honest guidance, and long term support.
            </p>

            <div className="footerContact">
              <a className="footerContactLink" href="mailto:tanviskinhealth@gmail.com">
                <FaEnvelope /> tanviskinhealth@gmail.com
              </a>
              <a className="footerContactLink" href="tel:+919876543210">
                <FaPhoneAlt /> +91 98765 43210
              </a>
              <p className="footerContactText">
                <FaMapMarkerAlt /> Tanvi Skin & Health Clinic, Srikakulam
              </p>
              <p className="footerContactText">
                <FaClock /> Mon - Sat: 9:00 AM - 8:00 PM
              </p>
            </div>

            <div className="footerSocial">
              <a className="footerSocialBtn" href="https://facebook.com" target="_blank" rel="noreferrer">
                <FaFacebookF />
              </a>
              <a className="footerSocialBtn" href="https://instagram.com" target="_blank" rel="noreferrer">
                <FaInstagram />
              </a>
              <a className="footerSocialBtn" href="https://twitter.com" target="_blank" rel="noreferrer">
                <FaTwitter />
              </a>
            </div>
          </div>

          <div className="footerCol">
            <h3 className="footerHeading">Quick Links</h3>
            <ul className="footerList">
              {quickLinks.map((item, i) => (
                <li key={i}>
                  <Link className="footerLink" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footerCol">
            <h3 className="footerHeading">Treatments</h3>
            <ul className="footerList">
              {treatmentLinks.map((item, i) => (
                <li key={i}>
                  <Link className="footerLink" to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footerCol footerCTA">
            <h3 className="footerHeading">Need Help?</h3>
            <p className="footerCtaText">
              Not sure which treatment suits you? Book a consultation and get a clear plan based on your concern.
            </p>
            <div className="footerButtons">
              <Link to="/contact" className="footerBtn primary">
                Book Appointment
              </Link>
              <Link to="/contact" className="footerBtn ghost">
                Contact Clinic
              </Link>
            </div>
          </div>
        </div>

        <div className="footerMobile">
          <h2 className="footerLogo mobileLogo">Tanvi Skin & Health</h2>

          {mobileSections.map((sec, index) => (
            <div className="footerMobileSection" key={index}>
              <div className="footerMobileHeader" onClick={() => toggleSection(index)}>
                <h3>{sec.title}</h3>
                <span>{openIndex === index ? "-" : "+"}</span>
              </div>

              <div className={`footerMobileBody ${openIndex === index ? "show" : ""}`}>
                {sec.type === "links" && (
                  <ul className="footerMobileList">
                    {sec.items.map((it, i) => (
                      <li key={i}>
                        <Link className="footerLink" to={it.to}>
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.type === "info" && (
                  <div className="footerMobileInfo">
                    {sec.items.map((it, i) =>
                      it.href ? (
                        <a key={i} className="footerContactLink" href={it.href}>
                          {it.icon} {it.text}
                        </a>
                      ) : (
                        <p key={i} className="footerContactText">
                          {it.icon} {it.text}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="footerSocial mobileSocial">
            <a className="footerSocialBtn" href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebookF />
            </a>
            <a className="footerSocialBtn" href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram />
            </a>
            <a className="footerSocialBtn" href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className="footerBottom">
          <div className="footerBottomLeft">
            <Link to="/privacy" className="footerBottomLink">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="footerBottomLink">Terms</Link>
            <span>•</span>
            <Link to="/contact" className="footerBottomLink">Support</Link>
          </div>

          <div className="footerBottomRight">
            © {new Date().getFullYear()} Tanvi Skin & Health Clinic
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
