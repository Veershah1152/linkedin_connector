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
            fontSize: "8.5pt", 
            color: "#555", 
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

export default function ExecutiveTemplate({ resume }) {
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
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#fff",
      color: "#1a1a1a",
      fontSize: "9pt",
      lineHeight: "1.6",
      boxShadow: "0 4px 60px rgba(0,0,0,0.2)",
    }}>
      {/* Dark Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D1B2A 0%, #1B2838 60%, #1a1a2e 100%)",
        color: "#fff",
        padding: "30px 40px",
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}>
        {/* Avatar */}
        <div style={{
          width: 68, height: 68, borderRadius: "50%",
          background: "linear-gradient(135deg, #0A66C2, #7C3AED)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22pt", fontWeight: 800, color: "#fff",
          flexShrink: 0, letterSpacing: "-1px",
          border: "2.5px solid rgba(255,255,255,0.15)",
        }}>
          {initials.toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "20pt", fontWeight: 900, margin: "0 0 4px", color: "#fff", letterSpacing: "-0.3px" }}>{name}</h1>
          {role && (
            <div style={{ fontSize: "9.5pt", color: "#64B5F6", fontWeight: 600, marginBottom: 10, letterSpacing: "0.3px" }}>{role}</div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", fontSize: "8pt", color: "#B0BEC5" }}>
            {email && <span>✉ {email}</span>}
            {phone && <span>📱 {phone}</span>}
            {location && <span>📍 {location}</span>}
            {social.linkedin && (
              <span style={{ color: "#64B5F6" }}>
                🔗 {social.linkedin.replace("https://www.linkedin.com/in/", "").replace("https://linkedin.com/in/", "")}
              </span>
            )}
            {social.github && (
              <span>⌥ {social.github.replace("https://github.com/", "github.com/")}</span>
            )}
          </div>
        </div>

        {/* ATS badge */}
        {resume?.ats_score && (
          <div style={{
            flexShrink: 0, textAlign: "center",
            border: "2px solid rgba(100,181,246,0.4)",
            borderRadius: 8, padding: "10px 16px",
          }}>
            <div style={{ fontSize: "18pt", fontWeight: 900, color: "#64B5F6" }}>{resume.ats_score}%</div>
            <div style={{ fontSize: "6.5pt", color: "#78909C", textTransform: "uppercase", letterSpacing: "1px" }}>ATS Score</div>
          </div>
        )}
      </div>

      {/* Gradient accent bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #0A66C2 0%, #7C3AED 100%)" }} />

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 92mm", gap: 0 }}>
        {/* Left column — main content */}
        <div style={{ padding: "28px 28px 28px 40px", borderRight: "1px solid #F0F0F0" }}>
          {/* Summary */}
          {resume?.summary && (
            <ExecSection label="Executive Summary">
              <p style={{
                color: "#444", fontSize: "9pt", lineHeight: 1.8,
                borderLeft: "3px solid #0A66C2", paddingLeft: 12,
                fontStyle: "italic",
              }}>{resume.summary}</p>
            </ExecSection>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <ExecSection label="Professional Experience">
              {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i < experience.length - 1 ? 18 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "10.5pt", color: "#0D1B2A" }}>{exp.jobTitle}</div>
                      <div style={{ fontWeight: 600, fontSize: "9pt", color: "#0A66C2" }}>
                        {exp.companyName}{exp.location ? ` · ${exp.location}` : ""}
                      </div>
                    </div>
                    <div style={{
                      background: "#EEF4FF", border: "1px solid #C5D8F7",
                      borderRadius: 4, padding: "2px 9px",
                      fontSize: "7.5pt", color: "#0A66C2", fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>
                      {formatResumeDate(exp.startDate)} – {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                    </div>
                  </div>
                  {exp.description && renderBulletPoints(exp.description)}
                  {i < experience.length - 1 && (
                    <div style={{ height: 1, background: "#F0F0F0", marginTop: 14 }} />
                  )}
                </div>
              ))}
            </ExecSection>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <ExecSection label="Key Projects">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {projects.map((proj, i) => (
                  <div key={i} style={{
                    padding: "10px 12px", border: "1px solid #E8F0FE",
                    borderRadius: 7, background: "#F8FAFF",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "9pt", color: "#0D1B2A" }}>{proj.name}</div>
                    {proj.role && <div style={{ fontSize: "7.5pt", color: "#0A66C2", marginTop: 2 }}>{proj.role}</div>}
                    {proj.description && renderBulletPoints(proj.description, { fontSize: "7.8pt", color: "#607D8B", marginTop: 4 })}
                  </div>
                ))}
              </div>
            </ExecSection>
          )}
        </div>

        {/* Right column — skills, edu, certs, achievements */}
        <div style={{ padding: "28px 28px 28px 24px", background: "#FAFAFA" }}>
          {/* Skills */}
          {skills.length > 0 && (
            <ExecSection label="Core Skills">
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {skills.map((skill, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5pt", fontWeight: 600, color: "#333", marginBottom: 4 }}>
                      <span>{skill}</span>
                    </div>
                    <div style={{ height: 4, background: "#E0E0E0", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${65 + (i * 7) % 33}%`, height: "100%",
                        background: "linear-gradient(90deg, #0A66C2, #7C3AED)",
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </ExecSection>
          )}

          {/* Education */}
          {education.length > 0 && (
            <ExecSection label="Education">
              {education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 14, paddingLeft: 10, borderLeft: "2px solid #0A66C2" }}>
                  <div style={{ fontWeight: 700, fontSize: "9pt", color: "#0D1B2A" }}>
                    {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: "8.5pt", color: "#0A66C2" }}>{edu.schoolName}</div>
                  <div style={{ fontSize: "7.5pt", color: "#888" }}>
                    {edu.startDate ? `${formatResumeDate(edu.startDate)} – ` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
                    {edu.grade ? ` · ${edu.grade}` : ""}
                  </div>
                </div>
              ))}
            </ExecSection>
          )}

          {/* Certifications */}
          {certs.length > 0 && (
            <ExecSection label="Certifications">
              {certs.map((cert, i) => (
                <div key={i} style={{ marginBottom: 12, paddingLeft: 10, borderLeft: "2px solid #7C3AED" }}>
                  <div style={{ fontWeight: 700, fontSize: "9pt", color: "#0D1B2A" }}>{cert.title}</div>
                  <div style={{ fontSize: "8pt", color: "#555" }}>{cert.issuingOrganization || cert.issuing_organization}</div>
                  <div style={{ fontSize: "7.5pt", color: "#888" }}>{formatResumeDate(cert.issueDate || cert.issue_date)}</div>
                </div>
              ))}
            </ExecSection>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <ExecSection label="Achievements">
              {achievements.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 9, alignItems: "flex-start" }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    background: "linear-gradient(135deg, #0A66C2, #7C3AED)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: "7.5pt", fontWeight: 800 }}>★</span>
                  </div>
                  <p style={{ fontSize: "8pt", color: "#555", lineHeight: 1.6, margin: 0 }}>{a}</p>
                </div>
              ))}
            </ExecSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecSection({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          fontWeight: 800, fontSize: "7.5pt", textTransform: "uppercase",
          letterSpacing: "2px", color: "#0D1B2A", whiteSpace: "nowrap",
        }}>{label}</div>
        <div style={{ flex: 1, height: 1.5, background: "linear-gradient(90deg, #0A66C2 0%, #E0E0E0 100%)" }} />
      </div>
      {children}
    </div>
  );
}
