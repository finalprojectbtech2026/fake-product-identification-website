import React from 'react';
import './Services.css';
import Footer from './Footer';
import Navbar from './Navbar';

function Services() {
    return (
        <div>
            <Navbar />
            <div className="services-wrapper" id="services">

                {/* Section 1: Hero section with Background Image */}
                <section
                    className="services-hero"
                    style={{ backgroundImage: `url('/Images/service-banner.jpg')` }}
                >
                    <div className="services-left-overlay">
                        <h1 className="services-title">Our Dermatology Services</h1>
                        <p className="services-subtext">
                            Expert skin and hair care treatments tailored for you. From acne and
                            pigmentation to advanced dermatology procedures, we deliver personalized
                            care with long-lasting results.
                        </p>
                    </div>
                </section>


                {/* Section 2: Foundation & Structure */}
                <section className="derma-foundation-section">
                    <div className="derma-foundation-left">
                        <h2 className="derma-foundation-heading">Advanced Dermatology Care</h2>
                        <p className="derma-foundation-text">
                            Premium skin and hair solutions designed around your concerns. From
                            clinical diagnosis to aesthetic treatments, we focus on visible results
                            with safe, modern dermatology.
                        </p>

                        <div className="derma-foundation-points">
                            <div className="derma-foundation-point">
                                <span className="derma-foundation-check">✓</span>
                                <span>Personalized treatment plans for every skin type</span>
                            </div>
                            <div className="derma-foundation-point">
                                <span className="derma-foundation-check">✓</span>
                                <span>Advanced solutions for acne, pigmentation, and scars</span>
                            </div>
                            <div className="derma-foundation-point">
                                <span className="derma-foundation-check">✓</span>
                                <span>Safe procedures with modern clinical equipment</span>
                            </div>
                            <div className="derma-foundation-point">
                                <span className="derma-foundation-check">✓</span>
                                <span>Expert consultation for skin, hair, and scalp concerns</span>
                            </div>
                        </div>

                        <button className="derma-foundation-btn">Know More</button>
                    </div>

                    <div className="derma-foundation-right">
                        <div className="derma-img-column">
                            <div className="derma-img-box small-box">
                                <img
                                    src="/Images/services/derma-consultation.jpg"
                                    alt="Dermatology consultation"
                                />
                            </div>
                            <div className="derma-img-box big-box">
                                <img
                                    src="/Images/services/derma-treatment.jpg"
                                    alt="Dermatology treatment"
                                />
                            </div>
                        </div>

                        <div className="derma-img-column">
                            <div className="derma-img-box big-box">
                                <img
                                    src="/Images/services/derma-skin.jpg"
                                    alt="Dermatology clinic"
                                />
                            </div>
                            <div className="derma-img-box small-box">
                                <img src="/Images/services/derma-clinic.jpg" alt="Healthy skin care" />
                            </div>
                        </div>
                    </div>
                </section>



                {/* Section 3: Split Layout - Electrical & Plumbing */}
                <section className="derma-split">
                    <div className="derma-split-box">
                        <div className="derma-slideshow-container">
                            <img src="/Images/services/derma-slide-1.jpg" alt="Slide 1" className="derma-slide" />
                            <img src="/Images/services/derma-slide-2.jpg" alt="Slide 2" className="derma-slide" />
                            <img src="/Images/services/derma-slide-3.jpg" alt="Slide 3" className="derma-slide" />
                            <img src="/Images/services/derma-slide-4.jpg" alt="Slide 4" className="derma-slide" />
                        </div>
                    </div>

                    <div className="derma-split-box">
                        <div className="derma-card-content">
                            <h2 className="derma-card-heading">Skin, Hair & Aesthetic Treatments</h2>

                            <p className="derma-card-description">
                                Experience premium dermatology care with modern treatments designed for visible results.
                                From clinical skin concerns to advanced aesthetic solutions, we focus on safe, personalized care
                                that suits your skin type and lifestyle.
                            </p>

                            <div className="derma-card-points">
                                <div className="derma-card-point">
                                    <span className="derma-card-check">✓</span>
                                    <span>Acne, pigmentation, and scar reduction treatments</span>
                                </div>
                                <div className="derma-card-point">
                                    <span className="derma-card-check">✓</span>
                                    <span>Hair fall, dandruff, and scalp infection care</span>
                                </div>
                                <div className="derma-card-point">
                                    <span className="derma-card-check">✓</span>
                                    <span>Laser, peel, and glow procedures with safety</span>
                                </div>
                                <div className="derma-card-point">
                                    <span className="derma-card-check">✓</span>
                                    <span>Personalized routine guidance and follow-ups</span>
                                </div>
                            </div>

                            <button className="derma-card-btn">Book Appointment</button>
                        </div>
                    </div>
                </section>


                {/* Section 4: Interior Design - Modular Kitchen Grid */}
                <section className="interior-kitchen-section">
                    <h2 className="interior-heading">Dermatology Treatments</h2>
                    <div className="interior-underline"></div>

                    <div className="interior-grid">
                        <div className="grid-col">
                            <div className="image-card split-card">
                                <img src="/Images/services/derma-consultation.jpg" alt="Skin Consultation" />
                                <div className="image-label">Skin Consultation</div>
                            </div>
                            <div className="image-card split-card">
                                <img src="/Images/services/derma-slide-3.jpg" alt="Hair & Scalp Care" />
                                <div className="image-label">Hair & Scalp Care</div>
                            </div>
                        </div>

                        <div className="grid-col">
                            <div className="image-card split-card">
                                <img src="/Images/services/derma-treatment.jpg" alt="Laser Treatment" />
                                <div className="image-label">Laser Treatment</div>
                            </div>
                            <div className="image-card split-card">
                                <img src="/Images/services/derma-slide-4.jpg" alt="Glow & Peel" />
                                <div className="image-label">Glow & Peel</div>
                            </div>
                        </div>

                        <div className="grid-col single">
                            <div className="image-card single-card">
                                <img src="/Images/services/clinic.jpg" alt="Modern Clinic" />
                                <div className="image-label">Modern Clinic</div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* Section 5: Interior Design - Circular Animation & Text */}
                <section className="derma-rotation-section">
                    <div className="derma-rotation-left">
                        <div className="derma-wrapper">
                            <div className="derma-inner" style={{ "--quantity": 8 }}>
                                {[
                                    "treatment1.jpg",
                                    "treatment2.jpg",
                                    "treatment3.jpg",
                                    "treatment4.jpg",
                                    "treatment5.jpg",
                                    "treatment6.jpg",
                                    "treatment7.jpg",
                                    "treatment8.jpg",
                                ].map((img, index) => (
                                    <div
                                        className="derma-rot-card"
                                        key={index}
                                        style={{
                                            "--index": index,
                                            "--color-card": "168, 85, 247",
                                        }}
                                    >
                                        <img className="derma-rot-img" src={`/Images/services/${img}`} alt={`treatment-${index}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="derma-rotation-right">
                        <h2 className="derma-rotation-title">Our Dermatology Treatments</h2>
                        <p className="derma-rotation-desc">
                            Personalized skin and hair care backed by clinical expertise. Explore our advanced treatments designed to give you healthy,
                            radiant, and confident skin.
                        </p>

                        <div className="derma-treatment-grid">
                            <div className="derma-treatment-col">
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Acne & Scar Treatment</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Pigmentation Correction</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Chemical Peel Therapy</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Laser Skin Resurfacing</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Anti-Aging Solutions</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Hydra Facial Treatments</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Dark Circle Reduction</div>
                            </div>

                            <div className="derma-treatment-col">
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Hair Fall Treatment</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Dandruff & Scalp Care</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Allergy & Rash Care</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Skin Brightening</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Warts & Mole Removal</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Stretch Mark Reduction</div>
                                <div className="derma-treatment-item"><span className="derma-tick">✓</span> Skin Infection Treatment</div>
                            </div>
                        </div>

                        <button className="derma-rotation-btn">Book Appointment</button>
                    </div>
                </section>



                {/* Section 6: Garden Showcase - 3D Parallax Fly-In 
                <section className="garden-parallax-section">
                    <h2 className="garden-title">Green Your Space</h2>
                    <p className="garden-subtitle">Interactive landscaping and garden design that breathes life into your home.</p>

                    <div className="garden-parallax-container">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div className="garden-card" key={index}>
                                <div className="garden-card-inner">
                                    <img
                                        src={`/Images/services/garden${index + 1}.jpg`}
                                        alt={`Garden ${index + 1}`}
                                        className="garden-img"
                                    />
                                    <div className="garden-overlay">
                                        <p className="overlay-text">Garden #{index + 1}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section> */}



                <Footer />
            </div>
        </div>
    );
}

export default Services;
