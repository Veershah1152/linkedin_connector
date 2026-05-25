import { formatResumeDate, parseBulletPoints } from "@/lib/template-engine";

function renderBulletPoints(descText) {
  const lines = parseBulletPoints(descText);
  if (lines.length === 0) return null;

  return (
    <ul style={{ margin: "6px 0 0 0", paddingLeft: "18px", listStyleType: "none" }}>
      {lines.map((line, idx) => (
        <li key={idx} style={{ position: "relative", fontSize: "9.5pt", color: "#4A5568", marginBottom: "6px", lineHeight: "1.6", textAlign: "left" }}>
          <span style={{ position: "absolute", left: "-14px", top: "0px", color: "#3182CE", fontSize: "12pt" }}>•</span>
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
  const projects = resume?.projects || [];
  const achievements = resume?.achievements || [];
  const social = resume?.social_links || {};

  const name = contact.fullName || resume?.title || "Your Name";
  const email = contact.email || "";
  const phone = contact.phone || "";
  const location = contact.location || "";
  const linkedin = social.linkedin ? social.linkedin.replace("https://www.linkedin.com/in/", "").replace("https://linkedin.com/in/", "") : "";
  const targetRole = resume?.target_role || "";

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#fff",
      color: "#1A202C",
      fontSize: "9.5pt",
      lineHeight: "1.6",
      padding: "20mm",
      boxShadow: "0 4px 60px rgba(0,0,0,0.1)",
      boxSizing: "border-box"
    }}>
      {/* Header */}
      <div style={{ borderBottom: "2px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28pt", fontWeight: "800", color: "#2D3748", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>{name}</h1>
          {targetRole && <div style={{ fontSize: "12pt", fontWeight: "600", color: "#3182CE", textTransform: "uppercase", letterSpacing: "1px" }}>{targetRole}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "9pt", color: "#718096", display: "flex", flexDirection: "column", gap: "4px" }}>
          {email && <div>{email}</div>}
          {phone && <div>{phone}</div>}
          {location && <div>{location}</div>}
          {linkedin && <div>linkedin.com/in/{linkedin}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px" }}>
        {/* Left Column - Main Content */}
        <div style={{ flex: "1 1 auto", maxWidth: "65%" }}>
          {/* Summary */}
          {resume?.summary && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Profile</h2>
              <p style={{ fontSize: "9.5pt", color: "#4A5568", margin: 0, lineHeight: "1.7" }}>{resume.summary}</p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Experience</h2>
              {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "18px", pageBreakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748" }}>{exp.jobTitle}</span>
                    <span style={{ fontSize: "9pt", fontWeight: "600", color: "#718096", backgroundColor: "#EDF2F7", padding: "2px 8px", borderRadius: "4px" }}>
                      {formatResumeDate(exp.startDate)} - {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                    </span>
                  </div>
                  <div style={{ fontSize: "10pt", fontWeight: "600", color: "#3182CE", marginBottom: "6px" }}>{exp.companyName}{exp.location ? ` | ${exp.location}` : ""}</div>
                  {renderBulletPoints(exp.description)}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Selected Projects</h2>
              {projects.map((proj, i) => (
                <div key={i} style={{ marginBottom: "16px", pageBreakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10.5pt", fontWeight: "700", color: "#2D3748" }}>{proj.name}</span>
                    {proj.url && <span style={{ fontSize: "9pt", color: "#3182CE" }}>{proj.url}</span>}
                  </div>
                  {proj.role && <div style={{ fontSize: "9.5pt", fontWeight: "600", color: "#4A5568", marginBottom: "6px" }}>{proj.role}</div>}
                  {renderBulletPoints(proj.description)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Secondary Content */}
        <div style={{ flex: "0 0 35%", paddingLeft: "24px", borderLeft: "2px solid #E2E8F0" }}>
          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Skills</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {skills.map((skill, i) => (
                  <span key={i} style={{ fontSize: "9pt", fontWeight: "500", color: "#4A5568", backgroundColor: "#EDF2F7", padding: "4px 10px", borderRadius: "6px" }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Education</h2>
              {education.map((edu, i) => (
                <div key={i} style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
                  <div style={{ fontSize: "10pt", fontWeight: "700", color: "#2D3748", marginBottom: "2px" }}>{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}</div>
                  <div style={{ fontSize: "9pt", fontWeight: "600", color: "#3182CE", marginBottom: "2px" }}>{edu.schoolName}</div>
                  <div style={{ fontSize: "8.5pt", color: "#718096" }}>
                    {edu.startDate ? `${formatResumeDate(edu.startDate)} - ` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
                  </div>
                  {edu.grade && <div style={{ fontSize: "8.5pt", color: "#718096", marginTop: "2px" }}>Grade: {edu.grade}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div style={{ marginBottom: "24px", pageBreakInside: "avoid" }}>
              <h2 style={{ fontSize: "11pt", fontWeight: "700", color: "#2D3748", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Awards</h2>
              <ul style={{ margin: "0", paddingLeft: "16px", listStyleType: "square", pageBreakInside: "avoid" }}>
                {achievements.map((ach, i) => (
                  <li key={i} style={{ fontSize: "9pt", color: "#4A5568", marginBottom: "6px", lineHeight: "1.5" }}>
                    {ach}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
