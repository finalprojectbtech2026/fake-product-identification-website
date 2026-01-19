import React, { useRef, useState } from "react";
import "./Contact.css";
import Navbar from "./Navbar";
import Footer from "./Footer";
import emailjs from "emailjs-com";

export default function Contact() {
  const banner = `${process.env.PUBLIC_URL}/Images/dermatology-clinic-banner.jpg`;
  const doctor1 = `${process.env.PUBLIC_URL}/Images/doctor-hareen-kumar.jpeg`;
  const doctor2 = `${process.env.PUBLIC_URL}/Images/doctor-mounika.jpeg`;
  const clinic1 = `${process.env.PUBLIC_URL}/Images/clinic-aesthetic-banner.jpg`;
  const clinic2 = `${process.env.PUBLIC_URL}/Images/skin-treatments-banner.jpg`;
  const clinic3 = `${process.env.PUBLIC_URL}/Images/hair-scalp-care-banner.jpg`;

  const mapLink =
    "https://www.google.com/maps/place/Dr+Hareen+Kumar+MD/@18.3067786,83.8932178,17z/data=!4m17!1m10!3m9!1s0x3a3c1590b7bee143:0x97d79a045a297045!2sDr+Hareen+Kumar+MD!8m2!3d18.3068395!4d83.8932299!10e5!14m1!1BCgIgAQ!16s%2Fg%2F11qbp_4zl7!3m5!1s0x3a3c1590b7bee143:0x97d79a045a297045!8m2!3d18.3068395!4d83.8932299!16s%2Fg%2F11qbp_4zl7?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoKLDEwMDc5MjA3M0gBUAM%3D";

  const formRef = useRef();
  const [popupVisible, setPopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(onlyDigits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      alert("Please enter a valid 10 digit mobile number.");
      return;
    }

    setLoading(true);

    emailjs
      .sendForm(
        "service_e98fcbm",
        "template_l9wjiox",
        formRef.current,
        "yW9142VHSbZnenGYS"
      )
      .then(
        () => {
          setLoading(false);
          setPopupVisible(true);
          setPhone("");
          formRef.current.reset();
        },
        (error) => {
          setLoading(false);
          console.error("EmailJS Error:", error);
          alert("Failed to send. Please try again.");
        }
      );
  };

  return (
    <>
      <Navbar />

      <section className="contactHero" style={{ backgroundImage: `url(${banner})` }}>
        <div className="contactHeroOverlay">
          <div className="contactHeroInner">
            <h1 className="contactHeroTitle">Contact Tanvi Skin & Health Clinic</h1>
            <p className="contactHeroDesc">
              We are here to help you with skin, hair, cosmetic and general medicine care. Reach out for consultations, appointments,
              and treatment guidance.
            </p>
            <div className="contactHeroActions">
              <a className="contactHeroBtn primary" href="tel:9390582488">Call Now</a>
              <a className="contactHeroBtn secondary" href={mapLink} target="_blank" rel="noreferrer">Get Directions</a>
            </div>
          </div>
        </div>
      </section>

      <section className="contactSection black">
        <div className="contactContainer">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Quick Contact</h2>
            <p className="sectionSub">
              For appointments, treatment queries, and follow-ups, use the details below.
            </p>
          </div>

          <div className="infoGrid">
            <div className="infoCard">
              <h3 className="infoTitle">Phone</h3>
              <p className="infoText">
                <a href="tel:9390582488">9390582488</a>
                <span className="dotSep">•</span>
                <a href="tel:7032942903">7032942903</a>
              </p>
            </div>

            <div className="infoCard">
              <h3 className="infoTitle">Clinic Address</h3>
              <p className="infoText">
                Ambedkar Junction Near Seetharama Medical Centre
              </p>
            </div>

            <div className="infoCard">
              <h3 className="infoTitle">Directions</h3>
              <p className="infoText">
                <a href={mapLink} target="_blank" rel="noreferrer">Open in Google Maps</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contactSection white">
        <div className="contactContainer">
          <div className="splitRow">
            <div className="splitLeft">
              <h2 className="splitTitle">Book an Appointment</h2>
              <p className="splitText">
                Share your details and our clinic team will contact you for appointment scheduling and consultation support.
              </p>

              <form ref={formRef} onSubmit={handleSubmit} className="contactForm">
                <div className="formRow">
                  <div className="field">
                    <label>Name</label>
                    <input name="name" type="text" placeholder="Enter your name" required />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="Enter 10 digit mobile number"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>

                <div className="formRow">
                  <div className="field">
                    <label>Email</label>
                    <input name="email" type="email" placeholder="Enter your email" required />
                  </div>
                  <div className="field">
                    <label>Service</label>
                    <select name="service" required>
                      <option value="Dermatology Consultation">Dermatology Consultation</option>
                      <option value="Cosmetic / Aesthetic Treatment">Cosmetic / Aesthetic Treatment</option>
                      <option value="Hair & Scalp Consultation">Hair & Scalp Consultation</option>
                      <option value="General Medicine Consultation">General Medicine Consultation</option>
                    </select>
                  </div>
                </div>

                <div className="field full">
                  <label>Message</label>
                  <textarea name="message" rows="5" placeholder="Tell us about your concern" required />
                </div>

                <button type="submit" className="submitBtn" disabled={loading}>
                  {loading ? "Sending..." : "Submit Request"}
                </button>
              </form>
            </div>

            <div className="splitRight">
              <div className="imageStack">
                <div className="stackCard">
                  <img src={clinic1} alt="clinic" />
                </div>
                <div className="stackCard">
                  <img src={clinic2} alt="treatments" />
                </div>
                <div className="stackCard">
                  <img src={clinic3} alt="hair care" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {popupVisible && (
        <div className="popupCard">
          <div className="popupInner">
            <h3>Form Submitted Successfully</h3>
            <p>Thank you. Our team will contact you soon.</p>
            <button className="popupBtn" onClick={() => setPopupVisible(false)}>Close</button>
          </div>
        </div>
      )}

      <section className="contactSection black">
        <div className="contactContainer">
          <div className="sectionHeader">
            <h2 className="sectionTitle">Meet Our Doctors</h2>
            <p className="sectionSub">
              Experienced clinicians offering skin, hair, cosmetic and general medicine care.
            </p>
          </div>

          <div className="doctorGrid">
            <div className="doctorCard">
              <div className="doctorImage">
                <img src={doctor1} alt="Dr Hareen Kumar" />
              </div>
              <div className="doctorBody">
                <h3 className="doctorName">Dr. Hareen Kumar Regulavalasa</h3>
                <p className="doctorRole">Co-Founder, Tanvi Skin & Health Clinic</p>
                <p className="doctorMeta">Senior Consultant Physician, General Medicine Specialist</p>
              </div>
            </div>

            <div className="doctorCard">
              <div className="doctorImage">
                <img src={doctor2} alt="Dr. Uddavolu Mounika" />
              </div>
              <div className="doctorBody">
                <h3 className="doctorName">Dr. Uddavolu Mounika</h3>
                <p className="doctorRole">Co-Founder, Tanvi Skin & Health Clinic</p>
                <p className="doctorMeta">MD (Dermatology), Consultant Dermatologist</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
