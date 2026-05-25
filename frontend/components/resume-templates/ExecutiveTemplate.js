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

function renderBulletPoints(descText) {
  if (!descText) return null;
  const lines = descText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^[\u2022\u25E6\u2023\u2043\u2219*•\-\s]+/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", listStyleType: "disc" }}>
      {lines.map((line, idx) => (
        <li key={idx} style={{ fontSize: "10pt", color: "#111", marginBottom: "4px", lineHeight: "1.5", textAlign: "justify" }}>
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
  const projects = resume?.projects || [];
  const achievements = resume?.achievements || [];
  const social = resume?.social_links || {};

  const name = contact.fullName || resume?.title || "Your Name";
  const email = contact.email || "";
  const phone = contact.phone || "";
  const location = contact.location || "";
  const linkedin = social.linkedin ? social.linkedin.replace("https://www.linkedin.com/in/", "linkedin.com/in/").replace("https://linkedin.com/in/", "linkedin.com/in/") : "";

  return (
    <div style={{
      fontFamily: "'Times New Roman', Times, serif",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#fff",
      color: "#000",
      fontSize: "10pt",
      lineHeight: "1.5",
      padding: "20mm 15mm",
      boxShadow: "0 4px 60px rgba(0,0,0,0.1)",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "24pt", fontWeight: "normal", margin: "0 0 4px 0", letterSpacing: "1px", textTransform: "uppercase" }}>{name}</h1>
        <div style={{ fontSize: "10pt", color: "#333", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "8px" }}>
          {location && <span>{location}</span>}
          {location && (phone || email || linkedin) && <span>|</span>}
          {phone && <span>{phone}</span>}
          {phone && (email || linkedin) && <span>|</span>}
          {email && <span>{email}</span>}
          {email && linkedin && <span>|</span>}
          {linkedin && <span>{linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume?.summary && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "10pt", margin: 0, textAlign: "justify", lineHeight: "1.5" }}>{resume.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
          <div style={{ borderBottom: "1px solid #000", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: "1px" }}>Experience</h2>
          </div>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                <span style={{ fontSize: "11pt", fontWeight: "bold" }}>{exp.companyName}{exp.location ? `, ${exp.location}` : ""}</span>
                <span style={{ fontSize: "10pt", fontStyle: "italic" }}>
                  {formatResumeDate(exp.startDate)} - {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                </span>
              </div>
              <div style={{ fontSize: "10pt", fontStyle: "italic", marginBottom: "4px" }}>{exp.jobTitle}</div>
              {renderBulletPoints(exp.description)}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
          <div style={{ borderBottom: "1px solid #000", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: "1px" }}>Selected Projects</h2>
          </div>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                <span style={{ fontSize: "11pt", fontWeight: "bold" }}>{proj.name}</span>
                {proj.url && <span style={{ fontSize: "10pt" }}>{proj.url}</span>}
              </div>
              {proj.role && <div style={{ fontSize: "10pt", fontStyle: "italic", marginBottom: "4px" }}>{proj.role}</div>}
              {renderBulletPoints(proj.description)}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
          <div style={{ borderBottom: "1px solid #000", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: "1px" }}>Education</h2>
          </div>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: "8px", pageBreakInside: "avoid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                <span style={{ fontSize: "11pt", fontWeight: "bold" }}>{edu.schoolName}</span>
                <span style={{ fontSize: "10pt", fontStyle: "italic" }}>
                  {edu.startDate ? `${formatResumeDate(edu.startDate)} - ` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
                </span>
              </div>
              <div style={{ fontSize: "10pt" }}>
                {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""} {edu.grade ? `| ${edu.grade}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
          <div style={{ borderBottom: "1px solid #000", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: "1px" }}>Skills</h2>
          </div>
          <div style={{ fontSize: "10pt", lineHeight: "1.5" }}>
            {skills.join(", ")}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
          <div style={{ borderBottom: "1px solid #000", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", margin: "0 0 4px 0", letterSpacing: "1px" }}>Honors & Awards</h2>
          </div>
          <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", listStyleType: "disc" }}>
            {achievements.map((ach, i) => (
              <li key={i} style={{ fontSize: "10pt", color: "#111", marginBottom: "4px", lineHeight: "1.5" }}>
                {ach}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
