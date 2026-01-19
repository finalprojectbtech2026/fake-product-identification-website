import React from "react";
import "./About.css";
import Navbar from "./Navbar";
import Footer from "./Footer";

const About = () => {
  return (
    <>
      <Navbar />

      <div className="about-page">
        <section className="about-section black">
          <div className="about-container hero-grid">
            <div className="hero-left">
              <h1 className="about-title">
                Tanvi Skin & Health <span>Clinic</span>
              </h1>
              <p className="about-subtitle">
                A place where modern dermatology meets trusted general medicine,
                with care that feels personal, precise, and truly helpful.
              </p>
              <div className="hero-highlights">
                <div className="highlight-box">
                  <h3>Skin</h3>
                  <p>Acne, pigmentation, allergy, laser and anti-aging care</p>
                </div>
                <div className="highlight-box">
                  <h3>Hair</h3>
                  <p>Hair fall, dandruff, regrowth plans and scalp analysis</p>
                </div>
                <div className="highlight-box">
                  <h3>General Medicine</h3>
                  <p>Fever, diabetes, hypertension, lifestyle disorders</p>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <img
                src="/Images/dermatology-clinic-banner.jpg"
                alt="Clinic Banner"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        <section className="about-section white">
          <div className="about-container split-grid">
            <div className="split-image">
              <img src="/Images/main-banner1.jpg" alt="Main Banner" />
            </div>
            <div className="split-content">
              <h2 className="section-title">About the Clinic</h2>
              <p className="section-text">
                Tanvi Skin & Health Clinic focuses on results, comfort, and
                complete care. We support patients with both dermatology and
                general medicine, so treatment feels connected and thorough.
              </p>
              <p className="section-text">
                Whether you are dealing with acne, pigmentation, hair fall, or a
                complex internal medicine concern, our goal is to give you a
                clear plan, correct diagnosis, and lasting improvement.
              </p>
              <div className="pill-row">
                <span className="pill">Patient-first care</span>
                <span className="pill">Modern procedures</span>
                <span className="pill">Trust and clarity</span>
                <span className="pill">Safe treatments</span>
              </div>
            </div>
          </div>
        </section>



        <section className="ownersNeo">
          <div className="ownersNeoGlow"></div>

          <div className="ownersNeoInner">
            <div className="ownersNeoHeadingWrap">
              <h2 className="ownersNeoHeading">Meet Our Clinic Owners</h2>
            </div>

            <div className="ownersNeoGrid">
              <div className="ownerNeoCard">
                <div className="ownerNeoBorder"></div>

                <div className="ownerNeoRarity">
                  <span className="ownerNeoGem"></span>
                  <span className="ownerNeoGem"></span>
                  <span className="ownerNeoGem"></span>
                </div>

                <div className="ownerNeoType">Founder</div>

                <div className="ownerNeoFrame">
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>

                  <img
                    src={`${process.env.PUBLIC_URL}/Images/doctor-hareen-kumar.jpeg`}
                    alt="Dr. Hareen Kumar"
                    className="ownerNeoImg"
                  />

                  <div className="ownerNeoFrameDark"></div>
                  <div className="ownerNeoShine"></div>
                  <div className="ownerNeoScanlines"></div>
                  <div className="ownerNeoHolo"></div>
                </div>

                <div className="ownerNeoBody">
                  <div className="ownerNeoName">Dr. Hareen Kumar Regulavalasa</div>

                  <div className="ownerNeoStats">
                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">🩺</div>
                      <div className="ownerNeoStatValue">MD</div>
                      <div className="ownerNeoStatLabel">Medicine</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">🏥</div>
                      <div className="ownerNeoStatValue">6+</div>
                      <div className="ownerNeoStatLabel">Years</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">💉</div>
                      <div className="ownerNeoStatValue">AIG</div>
                      <div className="ownerNeoStatLabel">FAIG</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">✅</div>
                      <div className="ownerNeoStatValue">Care</div>
                      <div className="ownerNeoStatLabel">Trusted</div>
                    </div>
                  </div>

                  <div className="ownerNeoAbility">
                    <div className="ownerNeoAbilityHeader">
                      <div className="ownerNeoAbilityIcon">💠</div>
                      <div className="ownerNeoAbilityName">Clinical Profile</div>
                      <div className="ownerNeoAbilityCost">Senior</div>
                    </div>

                    <div className="ownerNeoAbilityDesc">
                      <p><span>Qualification:</span> MBBS, MD (General Medicine)</p>
                      <p><span>Fellowships:</span> Primary Care Rheumatology, CCEBDM, FAIG</p>
                      <p><span>Expertise:</span> Diabetes, Hypertension, Infectious Diseases, Lifestyle Disorders</p>
                      <p><span>Position:</span> Co-Founder, Tanvi Skin & Health Clinic</p>
                    </div>
                  </div>

                  <div className="ownerNeoFlavor">
                    Evidence-based care with a focus on both acute and chronic medical support, including critical cases and multidisciplinary conditions.
                  </div>

                  <div className="ownerNeoId">TSH-001 • TANVI OWNERS</div>
                </div>

                <div className="ownerNeoGlitch"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
              </div>

              <div className="ownerNeoCard">
                <div className="ownerNeoBorder"></div>

                <div className="ownerNeoRarity">
                  <span className="ownerNeoGem"></span>
                  <span className="ownerNeoGem"></span>
                  <span className="ownerNeoGem"></span>
                </div>

                <div className="ownerNeoType">Founder</div>

                <div className="ownerNeoFrame">
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>
                  <div className="ownerNeoParticle"></div>

                  <img
                    src={`${process.env.PUBLIC_URL}/Images/doctor-mounika.jpeg`}
                    alt="Dr. Uddavolu Mounika"
                    className="ownerNeoImg"
                  />

                  <div className="ownerNeoFrameDark"></div>
                  <div className="ownerNeoShine"></div>
                  <div className="ownerNeoScanlines"></div>
                  <div className="ownerNeoHolo"></div>
                </div>

                <div className="ownerNeoBody">
                  <div className="ownerNeoName">Dr. Uddavolu Mounika</div>

                  <div className="ownerNeoStats">
                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">🩺</div>
                      <div className="ownerNeoStatValue">MD</div>
                      <div className="ownerNeoStatLabel">Dermatology</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">🏛️</div>
                      <div className="ownerNeoStatValue">RMC</div>
                      <div className="ownerNeoStatLabel">MBBS</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">🏥</div>
                      <div className="ownerNeoStatValue">GMC</div>
                      <div className="ownerNeoStatLabel">MD</div>
                    </div>

                    <div className="ownerNeoStat">
                      <div className="ownerNeoStatIcon">✅</div>
                      <div className="ownerNeoStatValue">Care</div>
                      <div className="ownerNeoStatLabel">Evidence-based</div>
                    </div>
                  </div>

                  <div className="ownerNeoAbility">
                    <div className="ownerNeoAbilityHeader">
                      <div className="ownerNeoAbilityIcon">💠</div>
                      <div className="ownerNeoAbilityName">Clinical Profile</div>
                      <div className="ownerNeoAbilityCost">Dermatologist</div>
                    </div>

                    <div className="ownerNeoAbilityDesc">
                      <p><span>Qualification:</span> MBBS (Rangaraya Medical College), MD (Dermatology, Guntur Medical College)</p>
                      <p><span>Experience:</span> Senior Resident, RIMS Government Medical College, Srikakulam</p>
                      <p><span>Specialization:</span> Skin, hair, and nail disorders</p>
                      <p><span>Approach:</span> Patient-focused, evidence-based dermatological care</p>
                    </div>
                  </div>

                  <div className="ownerNeoFlavor">
                    Specialized dermatology care focused on accurate diagnosis and personalized treatment for skin, hair, and nail concerns with evidence-based practice.
                  </div>

                  <div className="ownerNeoId">TSH-002 • TANVI OWNERS</div>
                </div>

                <div className="ownerNeoGlitch"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
                <div className="ownerNeoStream"></div>
              </div>
            </div>
          </div>
        </section>



        <section className="about-section white">
          <div className="about-container three-banner">
            <h2 className="section-title center">Special Care Areas</h2>
            <p className="section-text center">
              Dedicated focus areas that patients frequently seek help for.
            </p>

            <div className="three-grid">
              <div className="three-card">
                <img src="/Images/skin-treatments-banner.jpg" alt="Skin Care" />
                <h3>Skin Treatments</h3>
                <p>Acne, pigmentation, allergies, anti-aging and more.</p>
              </div>
              <div className="three-card">
                <img src="/Images/clinic-aesthetic-banner.jpg" alt="Aesthetic" />
                <h3>Aesthetic Care</h3>
                <p>Procedures that enhance your confidence naturally.</p>
              </div>
              <div className="three-card">
                <img src="/Images/hair-scalp-care-banner.jpg" alt="Hair Care" />
                <h3>Hair & Scalp</h3>
                <p>Solutions for hair fall and scalp health improvement.</p>
              </div>
            </div>
          </div>
        </section>





        <section className="aboutSplit">
          <div className="aboutSplitInner">
            <div className="aboutLeft">
              <div className="aboutImageWrap">
                <img
                  className="aboutCircleMain"
                  src={`${process.env.PUBLIC_URL}/Images/circle1.jpg`}
                  alt="Clinic"
                />
                <img
                  className="aboutCircleSub"
                  src={`${process.env.PUBLIC_URL}/Images/circle2.jpg`}
                  alt="Care"
                />
                <div className="aboutGlow"></div>
                <div className="aboutDots"></div>
              </div>
            </div>

            <div className="aboutRight">
              <h2 className="aboutTitle">
                Advanced Dermatology For
                <br /> Skin, Hair & Aesthetic Care
              </h2>

              <p className="aboutText">
                At Tanvi Skin & Health Skin, every treatment is designed around your
                skin type, lifestyle, and long term goals. From acne correction and
                pigmentation care to hair restoration and advanced aesthetic solutions,
                you get expert support backed by modern dermatology.
              </p>

              <div className="aboutPoints">
                <div className="aboutPoint">
                  <span className="pointTick"></span>
                  <p>Personalized skin and hair treatment plans</p>
                </div>

                <div className="aboutPoint">
                  <span className="pointTick"></span>
                  <p>Clinical grade procedures with safe care</p>
                </div>

                <div className="aboutPoint">
                  <span className="pointTick"></span>
                  <p>Modern aesthetic solutions for confidence</p>
                </div>

                <div className="aboutPoint">
                  <span className="pointTick"></span>
                  <p>Transparent guidance and result driven follow ups</p>
                </div>
              </div>

              <div className="aboutActions">
                <button className="aboutBtn">More About Us</button>
                <button className="aboutBtn ghost">Explore Treatments</button>
              </div>
            </div>
          </div>
        </section>



        <section className="about-section black">
          <div className="about-container stats-section">
            <div className="stats-left">
              <h2 className="section-title white-title">Experience That Matters</h2>
              <p className="section-text white-text">
                From everyday concerns to complex cases, our doctors bring
                strong clinical experience and thoughtful care.
              </p>
              <div className="stats-grid">
                <div className="stat-box">
                  <h3>6+</h3>
                  <p>Years Consultant Physician Experience</p>
                </div>
                <div className="stat-box">
                  <h3>1000+</h3>
                  <p>Patients Supported Across Specialities</p>
                </div>
                <div className="stat-box">
                  <h3>Advanced</h3>
                  <p>Dermatology & Aesthetic Procedures</p>
                </div>
                <div className="stat-box">
                  <h3>Trusted</h3>
                  <p>Clear Plans and Safe Treatment</p>
                </div>
              </div>
            </div>

            <div className="stats-right">
              <div className="icon-row">
                <img src="/Images/icons8-stethoscope-50.png" alt="Stethoscope" />
                <img src="/Images/icons8-heart-with-pulse-50.png" alt="Heart" />
                <img src="/Images/icons8-star-of-life-50.png" alt="Care" />
                <img src="/Images/icons8-caduceus-100.png" alt="Clinic" />
              </div>
              <div className="stats-card">
                <h3>We keep it simple</h3>
                <p>
                  Understand your concern, diagnose carefully, explain clearly,
                  treat safely.
                </p>
              </div>
            </div>
          </div>
        </section>






        <section className="about-section white">
          <div className="about-container values-section">
            <h2 className="section-title center">What We Stand For</h2>
            <p className="section-text center">
              Strong values, consistent care, and results you can trust.
            </p>

            <div className="values-grid">
              <div className="value-card">
                <h3>Clarity</h3>
                <p>We explain the real cause and the best approach.</p>
              </div>
              <div className="value-card">
                <h3>Safety</h3>
                <p>Procedures and medicines with proper guidance.</p>
              </div>
              <div className="value-card">
                <h3>Consistency</h3>
                <p>Follow-ups that keep your recovery on track.</p>
              </div>
              <div className="value-card">
                <h3>Respect</h3>
                <p>Your concerns are always treated seriously.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section black">
          <div className="about-container timeline-section">
            <h2 className="section-title center white-title">Care Journey</h2>
            <p className="section-text center white-text">
              A simple process designed to give you confidence and results.
            </p>

            <div className="timeline-grid">
              <div className="timeline-step">
                <span className="step-number">01</span>
                <h3>Consult</h3>
                <p>We listen carefully and understand your symptoms.</p>
              </div>
              <div className="timeline-step">
                <span className="step-number">02</span>
                <h3>Diagnose</h3>
                <p>We identify the root cause and explain it clearly.</p>
              </div>
              <div className="timeline-step">
                <span className="step-number">03</span>
                <h3>Treat</h3>
                <p>Safe, modern treatment plans tailored to you.</p>
              </div>
              <div className="timeline-step">
                <span className="step-number">04</span>
                <h3>Follow-up</h3>
                <p>Tracking results and improving outcomes over time.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section white">
          <div className="about-container why-section">
            <div className="why-left">
              <h2 className="section-title">Why Patients Choose Us</h2>
              <p className="section-text">
                We focus on correct diagnosis and a clear plan. We treat skin,
                hair and general medicine concerns with attention and patience.
              </p>
              <div className="why-points">
                <div className="why-point">
                  <span className="check" />
                  <p>Experienced doctors with strong clinical background</p>
                </div>
                <div className="why-point">
                  <span className="check" />
                  <p>Modern dermatology and aesthetic procedures</p>
                </div>
                <div className="why-point">
                  <span className="check" />
                  <p>Transparent explanations and realistic expectations</p>
                </div>
                <div className="why-point">
                  <span className="check" />
                  <p>One clinic for skin, hair and internal medicine</p>
                </div>
              </div>
            </div>

            <div className="why-right">
              <div className="why-card">
                <h3>Personalised Treatment</h3>
                <p>
                  Every plan is built around your condition, lifestyle, and
                  goals.
                </p>
              </div>
              <div className="why-card">
                <h3>Result Focused</h3>
                <p>
                  You will always know what is happening and why it matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section black">
          <div className="about-container cta-section">
            <div className="cta-box">
              <h2>Ready to Start Your Care?</h2>
              <p>
                Whether it is skin, hair, or general medicine, we are here to
                help you feel better and look better with safe, proven care.
              </p>
              <a href="/contact" className="cta-button">
                Book an Appointment
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default About;
