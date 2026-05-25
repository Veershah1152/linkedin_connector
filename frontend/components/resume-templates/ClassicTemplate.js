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
      margin: "6px 0 0 0", 
      paddingLeft: "16px", 
      listStyleType: "disc" 
    }}>
      {lines.map((line, idx) => (
        <li 
          key={idx} 
          style={{ 
            fontSize: "8.5pt", 
            color: "#3D3D3D", 
            marginBottom: "4px", 
            lineHeight: "1.6",
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

export default function ClassicTemplate({ resume }) {
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

  const contactLine = [email, phone, location].filter(Boolean).join("  ·  ");
  const socialLine = [
    social.linkedin && social.linkedin.replace("https://", ""),
    social.github && social.github.replace("https://github.com/", "github.com/"),
    social.portfolio && social.portfolio.replace("https://", ""),
  ].filter(Boolean).join("  ·  ");

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', 'Palatino', serif",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#fff",
      color: "#1C1C1C",
      padding: "36px 44px",
      boxSizing: "border-box",
      fontSize: "9pt",
      lineHeight: "1.6",
      boxShadow: "0 4px 60px rgba(0,0,0,0.2)",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", paddingBottom: 20, marginBottom: 20, borderBottom: "2.5px solid #1C1C1C" }}>
        <h1 style={{
          fontSize: "22pt", fontWeight: 700, margin: "0 0 6px",
          letterSpacing: "4px", textTransform: "uppercase",
          color: "#0D0D0D",
        }}>{name}</h1>
        {role && (
          <div style={{
            fontSize: "9.5pt", color: "#555", fontStyle: "italic",
            letterSpacing: "1px", marginBottom: 12,
          }}>{role}</div>
        )}
        {contactLine && (
          <div style={{ fontSize: "8pt", color: "#555", letterSpacing: "0.3px" }}>{contactLine}</div>
        )}
        {socialLine && (
          <div style={{ fontSize: "7.5pt", color: "#777", marginTop: 4, letterSpacing: "0.3px" }}>{socialLine}</div>
        )}
      </div>

      {/* Summary */}
      {resume?.summary && (
        <ClassicSection label="Professional Summary">
          <p style={{
            textAlign: "justify", color: "#3D3D3D",
            fontStyle: "italic", fontSize: "9pt", lineHeight: 1.8,
            borderLeft: "2px solid #1C1C1C", paddingLeft: 14,
          }}>{resume.summary}</p>
        </ClassicSection>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <ClassicSection label="Work Experience">
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < experience.length - 1 ? 18 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "10pt", color: "#0D0D0D" }}>{exp.jobTitle}</span>
                  <span style={{ color: "#555", fontSize: "9.5pt" }}> — {exp.companyName}</span>
                  {exp.location && <span style={{ color: "#888", fontSize: "8.5pt" }}>, {exp.location}</span>}
                </div>
                <div style={{
                  fontSize: "8pt", color: "#666",
                  fontStyle: "italic", whiteSpace: "nowrap",
                }}>
                  {formatResumeDate(exp.startDate)} – {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                </div>
              </div>
              {exp.description && renderBulletPoints(exp.description)}
              {i < experience.length - 1 && (
                <div style={{ height: 1, background: "#E8E8E8", marginTop: 14 }} />
              )}
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Education */}
      {education.length > 0 && (
        <ClassicSection label="Education">
          {education.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "9.5pt", color: "#0D0D0D" }}>
                  {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                </div>
                <div style={{ fontSize: "9pt", color: "#444", fontStyle: "italic" }}>{edu.schoolName}</div>
                {edu.grade && <div style={{ fontSize: "8pt", color: "#666", marginTop: 1 }}>GPA / Grade: {edu.grade}</div>}
              </div>
              <div style={{ fontSize: "8pt", color: "#666", whiteSpace: "nowrap", fontStyle: "italic" }}>
                {edu.startDate ? `${formatResumeDate(edu.startDate)} – ` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
              </div>
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Skills - two column */}
      {skills.length > 0 && (
        <ClassicSection label="Core Competencies">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px 16px" }}>
            {skills.map((s, i) => (
              <div key={i} style={{ fontSize: "8.5pt", color: "#3D3D3D", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#1C1C1C", fontSize: "9pt" }}>▸</span> {s}
              </div>
            ))}
          </div>
        </ClassicSection>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <ClassicSection label="Notable Projects">
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: "9.5pt", color: "#0D0D0D" }}>{proj.name}</span>
              {proj.role && <span style={{ color: "#666", fontSize: "8.5pt" }}> — {proj.role}</span>}
              {proj.url && <span style={{ color: "#555", fontSize: "8pt" }}> · {proj.url}</span>}
              {proj.description && renderBulletPoints(proj.description, { color: "#444" })}
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Certs */}
      {certs.length > 0 && (
        <ClassicSection label="Certifications">
          {certs.map((cert, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: "9pt" }}>{cert.title}</span>
                <span style={{ color: "#666", fontSize: "8.5pt" }}> — {cert.issuingOrganization || cert.issuing_organization}</span>
              </div>
              <div style={{ fontSize: "8pt", color: "#888", fontStyle: "italic" }}>{formatResumeDate(cert.issueDate || cert.issue_date)}</div>
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <ClassicSection label="Awards & Achievements">
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {achievements.map((a, i) => (
              <li key={i} style={{ fontSize: "8.5pt", color: "#3D3D3D", marginBottom: 5, lineHeight: 1.65 }}>{a}</li>
            ))}
          </ul>
        </ClassicSection>
      )}
    </div>
  );
}

function ClassicSection({ label, children }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{
        fontSize: "9pt", fontWeight: 700,
        letterSpacing: "2.5px", textTransform: "uppercase",
        color: "#0D0D0D", margin: "0 0 10px",
        paddingBottom: 5, borderBottom: "1.5px solid #1C1C1C",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {label}
      </h2>
      {children}
    </div>
  );
}
