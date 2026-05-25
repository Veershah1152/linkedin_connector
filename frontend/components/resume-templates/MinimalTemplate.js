import { formatResumeDate, parseBulletPoints } from "@/lib/template-engine";

function renderBulletPoints(descText, itemStyle = {}) {
  const lines = parseBulletPoints(descText);
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

export default function MinimalTemplate({ resume }) {
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

  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      width: "210mm",
      minHeight: "297mm",
      margin: "0 auto",
      background: "#FFFFFF",
      color: "#111",
      boxSizing: "border-box",
      fontSize: "9pt",
      lineHeight: "1.6",
      boxShadow: "0 4px 60px rgba(0,0,0,0.2)",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 5, background: "#111" }} />

      <div style={{ padding: "32px 44px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{
                fontSize: "24pt", fontWeight: 800, margin: "0 0 4px",
                letterSpacing: "-0.5px", color: "#000",
              }}>{name}</h1>
              {role && (
                <div style={{ fontSize: "10pt", color: "#555", fontWeight: 500 }}>{role}</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {email && <div style={{ fontSize: "8pt", color: "#555", marginBottom: 2 }}>{email}</div>}
              {phone && <div style={{ fontSize: "8pt", color: "#555", marginBottom: 2 }}>{phone}</div>}
              {location && <div style={{ fontSize: "8pt", color: "#555", marginBottom: 2 }}>{location}</div>}
              {social.linkedin && (
                <div style={{ fontSize: "7.5pt", color: "#0A66C2" }}>
                  {social.linkedin.replace("https://www.linkedin.com/in/", "linkedin.com/in/").replace("https://linkedin.com/in/", "linkedin.com/in/")}
                </div>
              )}
              {social.github && (
                <div style={{ fontSize: "7.5pt", color: "#333" }}>
                  {social.github.replace("https://github.com/", "github.com/")}
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 1.5, background: "#111", marginTop: 18 }} />
        </div>

        {/* Summary */}
        {resume?.summary && (
          <MinSection label="About">
            <p style={{ color: "#444", fontSize: "9pt", lineHeight: 1.8 }}>{resume.summary}</p>
          </MinSection>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <MinSection label="Experience">
            {experience.map((exp, i) => (
              <MinTimelineItem key={i}
                left={<>
                  <div style={{ fontSize: "7.5pt", color: "#888", whiteSpace: "nowrap" }}>
                    {formatResumeDate(exp.startDate)}
                  </div>
                  <div style={{ fontSize: "7.5pt", color: "#888", whiteSpace: "nowrap" }}>
                    – {exp.current ? "Present" : formatResumeDate(exp.endDate)}
                  </div>
                  {exp.location && (
                    <div style={{ fontSize: "7pt", color: "#aaa", marginTop: 3 }}>{exp.location}</div>
                  )}
                </>}
                right={<>
                  <div style={{ fontWeight: 800, fontSize: "10pt", color: "#000" }}>{exp.jobTitle}</div>
                  <div style={{ fontSize: "9pt", color: "#444", fontWeight: 600, marginBottom: 5 }}>{exp.companyName}</div>
                  {exp.description && renderBulletPoints(exp.description)}
                </>}
              />
            ))}
          </MinSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <MinSection label="Education">
            {education.map((edu, i) => (
              <MinTimelineItem key={i}
                left={<div style={{ fontSize: "7.5pt", color: "#888" }}>
                  {edu.startDate ? `${formatResumeDate(edu.startDate)} –\n` : ""}{edu.endDate ? formatResumeDate(edu.endDate) : "Present"}
                </div>}
                right={<>
                  <div style={{ fontWeight: 800, fontSize: "9.5pt", color: "#000" }}>
                    {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                  </div>
                  <div style={{ fontSize: "9pt", color: "#444" }}>{edu.schoolName}</div>
                  {edu.grade && <div style={{ fontSize: "8pt", color: "#888", marginTop: 2 }}>{edu.grade}</div>}
                </>}
              />
            ))}
          </MinSection>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <MinSection label="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {skills.map((skill, i) => (
                <span key={i} style={{
                  padding: "3px 12px",
                  border: "1px solid #DDD",
                  borderRadius: 3,
                  fontSize: "8pt",
                  color: "#333",
                  background: "#FAFAFA",
                }}>{skill}</span>
              ))}
            </div>
          </MinSection>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <MinSection label="Projects">
            {projects.map((proj, i) => (
              <MinTimelineItem key={i}
                left={<div style={{ fontSize: "8pt", color: "#888" }}>{proj.role}</div>}
                right={<>
                  <div style={{ fontWeight: 700, fontSize: "9.5pt", color: "#000" }}>{proj.name}</div>
                  {proj.description && renderBulletPoints(proj.description)}
                  {proj.url && <div style={{ fontSize: "8pt", color: "#0A66C2" }}>{proj.url}</div>}
                </>}
              />
            ))}
          </MinSection>
        )}

        {/* Certs */}
        {certs.length > 0 && (
          <MinSection label="Certifications">
            {certs.map((cert, i) => (
              <MinTimelineItem key={i}
                left={<div style={{ fontSize: "7.5pt", color: "#888" }}>{formatResumeDate(cert.issueDate || cert.issue_date)}</div>}
                right={<>
                  <div style={{ fontWeight: 700, fontSize: "9pt", color: "#000" }}>{cert.title}</div>
                  <div style={{ fontSize: "8pt", color: "#555" }}>{cert.issuingOrganization || cert.issuing_organization}</div>
                </>}
              />
            ))}
          </MinSection>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <MinSection label="Achievements">
            {achievements.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                <span style={{ color: "#111", fontWeight: 800, marginTop: 1, fontSize: "9pt" }}>—</span>
                <p style={{ fontSize: "8.5pt", color: "#444", lineHeight: 1.65, margin: 0 }}>{a}</p>
              </div>
            ))}
          </MinSection>
        )}
      </div>
    </div>
  );
}

function MinSection({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: "7pt", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase", color: "#111", marginBottom: 14 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function MinTimelineItem({ left, right }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "0 24px", marginBottom: 16 }}>
      <div style={{ paddingTop: 2 }}>{left}</div>
      <div>{right}</div>
    </div>
  );
}
