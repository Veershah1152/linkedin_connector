function formatResumeDate(dateStr) {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^[A-Za-z]+\s+\d{4}$/i.test(trimmed) || trimmed.toLowerCase() === "present" || trimmed.toLowerCase() === "current") {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  const match = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (match) {
    const year = match[1];
    const month = parseInt(match[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
  }
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
  } catch (e) {}
  return trimmed;
}

function renderBulletPoints(descText, itemStyle = {}) {
  if (!descText) return null;
  const lines = descText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[\u2022\u25E6\u2023\u2043\u2219*•\-\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <ul style={{ 
      margin: "4px 0 0 0", 
      paddingLeft: "16px", 
      listStyleType: "disc" 
    }}>
      {lines.map((line, idx) => (
        <li 
          key={idx} 
          style={{ 
            fontSize: "8.3pt", 
            color: "#546E7A", 
            marginBottom: "4px", 
            lineHeight: "1.65",
            textAlign: "justify",
            ...itemStyle 
          }}
        >
          {line}
        </li>
      ))}
    </ul>
  );
}

export default function ModernTemplate({ resume }) {
  const contact = resume?.contact_info || {};
  const skills = resume?.skills || [];
  const experience = resume?.work_experience || [];
  const education = resume?.education || [];
  const certs = resume?.certifications || [];
  const projects = resume?.projects || [];
  const achievements = resume?.achievements || [];
  const social = resume?.social_links || {};

  const name = contact.fullName || resume?.title || "Your Name";
  const email = contact.email || "";
  const phone = contact.phone || "";
  const location = contact.location || "";
  const role = resume?.target_role || "";
  const nameParts = name.split(" ");
  const initials = nameParts.length >= 2
    ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
    : name.slice(0, 2);

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      display: "flex",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#fff",
      color: "#1a1a2e",
      fontSize: "8.8pt",
      lineHeight: "1.55",
      boxShadow: "0 4px 60px rgba(0,0,0,0.2)",
      overflow: "hidden",
    }}>
      {/* ── SIDEBAR ── */}
      <div style={{
        width: "68mm",
        background: "#0A2240",
        color: "#e8edf5",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #1565C0, #0288D1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: "24pt", fontWeight: 800, color: "#fff",
            border: "3px solid rgba(255,255,255,0.15)",
            letterSpacing: "-1px",
          }}>
            {initials.toUpperCase()}
          </div>
          <div style={{ fontSize: "13pt", fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 4 }}>{name}</div>
          {role && (
            <div style={{
              fontSize: "7.5pt", fontWeight: 600, color: "#64B5F6",
              textTransform: "uppercase", letterSpacing: "1px", marginTop: 4,
            }}>{role}</div>
          )}
          <div style={{ width: 32, height: 2, background: "#1565C0", margin: "12px auto 0", borderRadius: 1 }} />
        </div>

        {/* Contact */}
        <SideSection label="Contact">
          {email && <ContactItem icon="✉" text={email} small />}
          {phone && <ContactItem icon="📱" text={phone} />}
          {location && <ContactItem icon="📍" text={location} />}
          {social.linkedin && <ContactItem icon="in" text={social.linkedin.replace("https://www.linkedin.com/in/", "").replace("https://linkedin.com/in/", "")} link={social.linkedin} />}
          {social.github && <ContactItem icon="⌥" text={social.github.replace("https://github.com/", "github.com/")} link={social.github} />}
          {social.portfolio && <ContactItem icon="🌐" text={social.portfolio.replace("https://", "")} link={social.portfolio} small />}
        </SideSection>

        {/* Skills */}
        {skills.length > 0 && (
          <SideSection label="Skills">
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {skills.map((skill, i) => (
                <div key={i}>
                  <div style={{ fontSize: "7.8pt", color: "#B0BEC5", marginBottom: 3 }}>{skill}</div>
                  <div style={{ height: 3.5, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                    <div style={{
                      width: `${65 + (i * 7) % 33}%`, height: "100%",
                      background: "linear-gradient(90deg, #1565C0, #0288D1)",
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </SideSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <SideSection label="Education">
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#E3F2FD", lineHeight: 1.3 }}>
                  {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: "7.8pt", color: "#64B5F6", marginTop: 2 }}>{edu.schoolName}</div>
                <div style={{ fontSize: "7pt", color: "#78909C", marginTop: 2 }}>
                  {edu.startDate ? `${formatResumeDate(edu.startDate)} – ` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
                  {edu.grade ? ` · ${edu.grade}` : ""}
                </div>
              </div>
            ))}
          </SideSection>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <SideSection label="Certifications">
            {certs.map((cert, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 8, borderLeft: "2px solid #1565C0" }}>
                <div style={{ fontSize: "8pt", fontWeight: 700, color: "#E3F2FD" }}>{cert.title}</div>
                <div style={{ fontSize: "7.5pt", color: "#64B5F6", marginTop: 2 }}>{cert.issuingOrganization || cert.issuing_organization}</div>
                <div style={{ fontSize: "7pt", color: "#78909C", marginTop: 1 }}>{formatResumeDate(cert.issueDate || cert.issue_date)}</div>
              </div>
            ))}
          </SideSection>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>

        {/* Summary */}
        {resume?.summary && (
          <div>
            <MainSectionTitle label="Professional Summary" />
            <div style={{
              padding: "12px 16px",
              background: "#F0F7FF",
              borderLeft: "3px solid #1565C0",
              borderRadius: "0 6px 6px 0",
            }}>
              <p style={{ fontSize: "8.8pt", color: "#37474F", lineHeight: 1.75, margin: 0 }}>{resume.summary}</p>
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div>
            <MainSectionTitle label="Work Experience" />
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 18, paddingLeft: 14, borderLeft: `2px solid ${i === 0 ? "#1565C0" : "#E0E0E0"}`, position: "relative" }}>
                {/* Timeline dot */}
                <div style={{
                  position: "absolute", left: -5, top: 3,
                  width: 8, height: 8, borderRadius: "50%",
                  background: i === 0 ? "#1565C0" : "#BDBDBD",
                  border: "2px solid #fff",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 4 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "10pt", color: "#0A2240" }}>{exp.jobTitle}</div>
                    <div style={{ fontWeight: 600, fontSize: "8.8pt", color: "#1565C0", marginTop: 1 }}>{exp.companyName}{exp.location ? ` · ${exp.location}` : ""}</div>
                  </div>
                  <div style={{
                    fontSize: "7.5pt", color: "#607D8B", fontWeight: 500,
                    background: "#F5F5F5", padding: "2px 8px", borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}>
                    {formatResumeDate(exp.startDate)} – {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                  </div>
                </div>
                {exp.description && renderBulletPoints(exp.description)}
                {i < experience.length - 1 && <div style={{ height: 12 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <MainSectionTitle label="Projects" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {projects.map((proj, i) => (
                <div key={i} style={{
                  padding: "12px 14px",
                  border: "1px solid #E3F2FD",
                  borderRadius: 8,
                  background: "#FAFCFF",
                }}>
                  <div style={{ fontWeight: 700, fontSize: "9pt", color: "#0A2240" }}>{proj.name}</div>
                  {proj.role && <div style={{ fontSize: "7.5pt", color: "#1565C0", marginTop: 2 }}>{proj.role}</div>}
                  {proj.description && renderBulletPoints(proj.description, { fontSize: "8pt", color: "#607D8B", marginTop: 5 })}
                  {proj.url && <div style={{ fontSize: "7.5pt", color: "#0288D1", marginTop: 4 }}>{proj.url}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <MainSectionTitle label="Achievements & Awards" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#E3F2FD", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    <span style={{ fontSize: "8pt", color: "#1565C0" }}>★</span>
                  </div>
                  <p style={{ fontSize: "8.3pt", color: "#546E7A", lineHeight: 1.65, margin: 0 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SideSection({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: "6.8pt", fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "2px", color: "#64B5F6", marginBottom: 10,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{ flex: 1, height: 1, background: "rgba(100,181,246,0.3)" }} />
        {label}
        <div style={{ flex: 1, height: 1, background: "rgba(100,181,246,0.3)" }} />
      </div>
      {children}
    </div>
  );
}

function ContactItem({ icon, text, link, small }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 7 }}>
      <span style={{ fontSize: icon === "in" ? "7pt" : "8pt", width: 14, flexShrink: 0, marginTop: 1, color: "#64B5F6", fontWeight: icon === "in" ? 800 : 400 }}>{icon}</span>
      <span style={{ fontSize: small ? "7pt" : "7.5pt", color: "#B0BEC5", wordBreak: "break-all", lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function MainSectionTitle({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ fontWeight: 800, fontSize: "9pt", color: "#0A2240", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>
        {label}
      </div>
      <div style={{ flex: 1, height: 1.5, background: "linear-gradient(90deg, #1565C0 0%, transparent 100%)" }} />
    </div>
  );
}
