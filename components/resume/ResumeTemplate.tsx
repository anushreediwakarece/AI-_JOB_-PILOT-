import React from 'react'
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer'

// Define brand colors to give it a formal but modern touch
const primaryColor = '#111827'
const accentColor = '#2563eb' // A professional deep blue
const secondaryColor = '#4b5563'
const lightGray = '#f3f4f6'
const borderColor = '#e5e7eb'

const styles = StyleSheet.create({
  page: {
    padding: '40 45',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.5,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: accentColor,
    paddingBottom: 15,
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: primaryColor,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
    lineHeight: 1,
  },
  contactWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12, // React PDF supports gap
    marginBottom: 4,
  },
  contactItem: {
    fontSize: 9.5,
    color: secondaryColor,
  },
  link: {
    color: accentColor,
    textDecoration: 'none',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: accentColor,
    textTransform: 'uppercase',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    paddingBottom: 4,
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'justify',
    lineHeight: 1.6,
  },
  experienceBlock: {
    marginBottom: 14,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: primaryColor,
  },
  company: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Oblique',
    color: secondaryColor,
    marginBottom: 4,
  },
  date: {
    fontSize: 9.5,
    color: secondaryColor,
    fontFamily: 'Helvetica-Oblique',
  },
  responsibilities: {
    marginTop: 2,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3.5,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 12,
    fontSize: 10,
    color: accentColor,
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  educationBlock: {
    marginBottom: 10,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  degree: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: primaryColor,
  },
  school: {
    fontSize: 10,
    color: secondaryColor,
  },
  skillsBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  skillPill: {
    backgroundColor: lightGray,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    color: primaryColor,
    fontFamily: 'Helvetica-Bold',
  },
})

export interface PolishedWorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  currentlyWorking: boolean;
  polishedResponsibilities: string[];
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  professionalSummary: string;
  workExperience: PolishedWorkExperience[];
  education: {
    degree: string;
    fieldOfStudy: string;
    institution: string;
    graduationYear?: string | null;
  }[];
  skills: string[];
}

export const ResumeTemplate = ({ data }: { data: ResumeData }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName || 'Professional Profile'}</Text>
          <View style={styles.contactWrapper}>
            {data.email && <Text style={styles.contactItem}>{data.email}</Text>}
            {data.email && data.phone && <Text style={styles.contactItem}>|</Text>}
            {data.phone && <Text style={styles.contactItem}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={styles.contactItem}>|</Text>}
            {data.location && <Text style={styles.contactItem}>{data.location}</Text>}
          </View>
          <View style={styles.contactWrapper}>
            {data.linkedinUrl && (
              <Link src={data.linkedinUrl} style={styles.link}>
                LinkedIn
              </Link>
            )}
            {data.linkedinUrl && data.portfolioUrl && <Text style={styles.contactItem}>|</Text>}
            {data.portfolioUrl && (
              <Link src={data.portfolioUrl} style={styles.link}>
                Portfolio
              </Link>
            )}
          </View>
        </View>

        {/* SUMMARY */}
        {data.professionalSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.professionalSummary}</Text>
          </View>
        )}

        {/* WORK EXPERIENCE */}
        {data.workExperience && data.workExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.workExperience.map((exp, index) => (
              <View key={index} style={styles.experienceBlock}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobTitle}>{exp.title}</Text>
                  <Text style={styles.date}>
                    {exp.startDate} – {exp.currentlyWorking ? 'Present' : (exp.endDate || 'Present')}
                  </Text>
                </View>
                <Text style={styles.company}>{exp.company}</Text>
                <View style={styles.responsibilities}>
                  {exp.polishedResponsibilities.map((resp, idx) => (
                    <View key={idx} style={styles.bullet}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{resp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EDUCATION */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.educationBlock}>
                <View style={styles.educationHeader}>
                  <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  {edu.graduationYear && <Text style={styles.date}>{edu.graduationYear}</Text>}
                </View>
                <Text style={styles.school}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SKILLS */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical & Core Skills</Text>
            <View style={styles.skillsBlock}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={styles.skillPill}>{skill}</Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
