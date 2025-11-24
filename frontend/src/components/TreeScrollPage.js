import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, Send, User, MessageSquare } from 'lucide-react';
import '../styles/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      detail: '+1 (420) 690-1738',
      subtext: 'Mon-Fri from 9am to 6pm',
      color: '#ff6b6b'
    },
    {
      icon: Mail,
      title: 'Email',
      detail: 'help.appleverse@gmail.com',
      subtext: 'We\'ll respond within 24 hours',
      color: '#4ecdc4'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      detail: 'Monday – Friday',
      subtext: '9:00 AM – 6:00 PM EST',
      color: '#95e1d3'
    },
    {
      icon: MapPin,
      title: 'Address',
      detail: '300 Ouellette Ave',
      subtext: 'Windsor, ON N9A 1A5',
      color: '#f38181'
    }
  ];

  const teamMembers = [
    { initials: 'NM', name: 'Namratha Muraleedharan', role: 'Professional Apple Skin Peeler', color: '#ff6b6b' },
    { initials: 'SS', name: 'Sana Sehgal', role: 'Official Apple Eater', color: '#feca57' },
    { initials: 'J', name: 'Jayanth', role: 'Head of Fruit Bowls', color: '#48dbfb' },
    { initials: 'SK', name: 'Saima Khatoon', role: 'Chief of Crispy Apples', color: '#ff9ff3' }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ textAlign: 'center', alignItems: 'center' }}>
          <span className="hero-badge">Contact Us</span>
          <h1 className="hero-title">Let's Start a Conversation</h1>
          <p className="hero-subtitle">
            Have questions about apple varieties? Want to collaborate? We'd love to hear from you.
          </p>
        </div>
        <div className="hero-decoration">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
      </section>

      {/* Contact Info Grid */}
      <section className="info-section">
        <div className="container">
          <div className="info-grid">
            {contactInfo.map((item, index) => (
              <div key={index} className="info-card" style={{ '--card-color': item.color }}>
                <div className="info-icon-wrapper">
                  <item.icon className="info-icon" />
                </div>
                <h3 className="info-title">{item.title}</h3>
                <p className="info-detail">{item.detail}</p>
                <p className="info-subtext">{item.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Team Section */}
      <section className="content-section">
        <div className="container">
          <div className="two-column-layout">
            {/* Contact Form */}
            <div className="form-wrapper">
              <div className="section-header">
                <h2 className="section-title">Send us a Message</h2>
                <p className="section-description">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name" className={`form-label ${focusedField === 'name' ? 'focused' : ''}`}>
                    <User size={18} />
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className={`form-label ${focusedField === 'email' ? 'focused' : ''}`}>
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className={`form-label ${focusedField === 'subject' ? 'focused' : ''}`}>
                    <MessageSquare size={18} />
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('subject')}
                    onBlur={() => setFocusedField(null)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className={`form-label ${focusedField === 'message' ? 'focused' : ''}`}>
                    <MessageSquare size={18} />
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('message')}
                    onBlur={() => setFocusedField(null)}
                    className="form-textarea"
                    rows="5"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-button">
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>

            {/* Team Section */}
            <div className="team-wrapper">
              <div className="section-header">
                <h2 className="section-title">Our Team</h2>
                <p className="section-description">
                  Meet the passionate people behind AppleVerse.
                </p>
              </div>

              <div className="team-grid">
                {teamMembers.map((member, index) => (
                  <div key={index} className="team-card">
                    <div className="team-avatar" style={{ backgroundColor: member.color }}>
                      {member.initials}
                    </div>
                    <div className="team-info">
                      <h4 className="team-name">{member.name}</h4>
                      <p className="team-role">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Visit Our Research Center</h2>
            <p className="section-description">
              Come see where the magic happens. We're located in the heart of Windsor.
            </p>
          </div>

          <div className="map-container">
            <iframe
              title="AppleVerse Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2926.285999639731!2d-83.03788962337493!3d42.3163473711978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8829598c87e95d8d%3A0x7e861a6d4f1a36b8!2s300%20Ouellette%20Ave%2C%20Windsor%2C%20ON%20N9A%201A5!5e0!3m2!1sen!2sca!4v1698888888888!5m2!1sen!2sca"
              className="map-iframe"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;