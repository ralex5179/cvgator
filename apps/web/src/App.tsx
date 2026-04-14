import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { exportCvPdf, fetchTemplates, previewCv } from './api';
import {
  createDefaultCvData,
  createEmptyEducationItem,
  createEmptyExperienceItem,
  createEmptySkillItem,
} from './cvData';
import { parseImportedCvData, serializeCvData } from './cvDataJson';
import type { CvData, EducationItem, ExperienceItem, SkillItem, TemplateSummary } from './types';

const replaceListItem = <T,>(items: T[], index: number, item: T): T[] =>
  items.map((current, currentIndex) => (currentIndex === index ? item : current));

const readImportFile = async (file: Blob): Promise<string> => {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Response(file).text();
};

function App() {
  const [cvData, setCvData] = useState<CvData>(() => createDefaultCvData());
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateError, setTemplateError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [importError, setImportError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplateError('');

      try {
        const nextTemplates = await fetchTemplates();
        if (cancelled) {
          return;
        }

        setTemplates(nextTemplates);
        setSelectedTemplateId((currentTemplateId) => {
          if (currentTemplateId && nextTemplates.some((template) => template.id === currentTemplateId)) {
            return currentTemplateId;
          }

          return nextTemplates[0]?.id ?? '';
        });
      } catch (error) {
        if (!cancelled) {
          setTemplateError(error instanceof Error ? error.message : 'Unable to load templates right now.');
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };

    void loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  const updatePersonalField = (field: keyof CvData['personal'], value: string) => {
    setCvData((current) => ({
      ...current,
      personal: {
        ...current.personal,
        [field]: value,
      },
    }));
  };

  const updateExperienceField = (index: number, field: keyof ExperienceItem, value: string | string[]) => {
    setCvData((current) => {
      const nextItem: ExperienceItem = {
        ...current.experience[index],
        [field]: value,
      } as ExperienceItem;

      return {
        ...current,
        experience: replaceListItem(current.experience, index, nextItem),
      };
    });
  };

  const updateEducationField = (index: number, field: keyof EducationItem, value: string) => {
    setCvData((current) => {
      const nextItem: EducationItem = {
        ...current.education[index],
        [field]: value,
      };

      return {
        ...current,
        education: replaceListItem(current.education, index, nextItem),
      };
    });
  };

  const updateSkillField = (index: number, value: string) => {
    setCvData((current) => {
      const nextItem: SkillItem = {
        ...current.skills[index],
        name: value,
      };

      return {
        ...current,
        skills: replaceListItem(current.skills, index, nextItem),
      };
    });
  };

  const submitPreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplateId) {
      setPreviewError('Select a template before generating a preview.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError('');

    try {
      const html = await previewCv(selectedTemplateId, cvData);
      setPreviewHtml(html);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Unable to generate preview right now.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!selectedTemplateId) {
      setPdfError('Select a template before exporting a PDF.');
      return;
    }

    setPdfLoading(true);
    setPdfError('');

    try {
      const pdfBlob = await exportCvPdf(selectedTemplateId, cvData);
      const url = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'cvgator-cv.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Unable to export PDF right now.');
    } finally {
      setPdfLoading(false);
    }
  };

  const exportJson = () => {
    const blob = new Blob([serializeCvData(cvData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cvgator-cv.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const importedText = await readImportFile(file);
      const importedCvData = parseImportedCvData(importedText);
      setCvData(importedCvData);
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unable to import this file.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">M4 Frontend</p>
          <h1>Draft CV, choose template, preview rendered output.</h1>
          <p className="hero-copy">
            Frontend owns data entry and JSON import/export. Backend owns template resolution and HTML rendering.
          </p>
        </div>

        <div className="hero-actions">
          <button type="button" className="secondary-button" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={importJson}
          />
        </div>
      </section>

      <section className="workspace">
        <form className="editor-panel" onSubmit={submitPreview}>
          <div className="panel-header">
            <div>
              <p className="section-label">Editor</p>
              <h2>CV data</h2>
            </div>

            <div className="template-picker">
              <label htmlFor="templateId">Template</label>
              <select
                id="templateId"
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                disabled={templatesLoading || templates.length === 0}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {templateError ? <p className="status error">{templateError}</p> : null}
          {importError ? <p className="status error">{importError}</p> : null}
          {selectedTemplate ? <p className="status info">{selectedTemplate.description}</p> : null}

          <section className="form-section">
            <div className="section-title-row">
              <div>
                <p className="section-label">Section</p>
                <h3>Personal details</h3>
              </div>
            </div>

            <div className="field-grid">
              <label>
                Full name
                <input
                  value={cvData.personal.fullName}
                  onChange={(event) => updatePersonalField('fullName', event.target.value)}
                />
              </label>
              <label>
                Title
                <input
                  value={cvData.personal.title}
                  onChange={(event) => updatePersonalField('title', event.target.value)}
                />
              </label>
              <label>
                Email
                <input
                  value={cvData.personal.email}
                  onChange={(event) => updatePersonalField('email', event.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  value={cvData.personal.phone}
                  onChange={(event) => updatePersonalField('phone', event.target.value)}
                />
              </label>
              <label className="full-width">
                Location
                <input
                  value={cvData.personal.location}
                  onChange={(event) => updatePersonalField('location', event.target.value)}
                />
              </label>
              <label className="full-width">
                Summary
                <textarea
                  value={cvData.personal.summary}
                  onChange={(event) => updatePersonalField('summary', event.target.value)}
                  rows={4}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title-row">
              <div>
                <p className="section-label">Section</p>
                <h3>Experience</h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCvData((current) => ({
                    ...current,
                    experience: [...current.experience, createEmptyExperienceItem()],
                  }))
                }
              >
                Add experience
              </button>
            </div>

            <div className="stack-list">
              {cvData.experience.map((item, index) => (
                <article key={`${index}-${item.role}`} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Role #{index + 1}</strong>
                    {cvData.experience.length > 1 ? (
                      <button
                        type="button"
                        className="ghost-button danger-button"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            experience: current.experience.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="field-grid">
                    <label>
                      Role
                      <input
                        value={item.role}
                        onChange={(event) => updateExperienceField(index, 'role', event.target.value)}
                      />
                    </label>
                    <label>
                      Company
                      <input
                        value={item.company}
                        onChange={(event) => updateExperienceField(index, 'company', event.target.value)}
                      />
                    </label>
                    <label>
                      Location
                      <input
                        value={item.location}
                        onChange={(event) => updateExperienceField(index, 'location', event.target.value)}
                      />
                    </label>
                    <label>
                      Start date
                      <input
                        value={item.startDate}
                        onChange={(event) => updateExperienceField(index, 'startDate', event.target.value)}
                      />
                    </label>
                    <label>
                      End date
                      <input
                        value={item.endDate}
                        onChange={(event) => updateExperienceField(index, 'endDate', event.target.value)}
                      />
                    </label>
                    <label className="full-width">
                      Highlights
                      <textarea
                        value={item.highlights.join('\n')}
                        onChange={(event) =>
                          updateExperienceField(
                            index,
                            'highlights',
                            event.target.value
                              .split('\n')
                              .map((highlight) => highlight.trim())
                              .filter((highlight) => highlight.length > 0),
                          )
                        }
                        rows={4}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="form-section">
            <div className="section-title-row">
              <div>
                <p className="section-label">Section</p>
                <h3>Education</h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCvData((current) => ({
                    ...current,
                    education: [...current.education, createEmptyEducationItem()],
                  }))
                }
              >
                Add education
              </button>
            </div>

            <div className="stack-list">
              {cvData.education.map((item, index) => (
                <article key={`${index}-${item.degree}`} className="entry-card">
                  <div className="entry-card-header">
                    <strong>Education #{index + 1}</strong>
                    {cvData.education.length > 1 ? (
                      <button
                        type="button"
                        className="ghost-button danger-button"
                        onClick={() =>
                          setCvData((current) => ({
                            ...current,
                            education: current.education.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="field-grid">
                    <label>
                      Degree
                      <input
                        value={item.degree}
                        onChange={(event) => updateEducationField(index, 'degree', event.target.value)}
                      />
                    </label>
                    <label>
                      Institution
                      <input
                        value={item.institution}
                        onChange={(event) => updateEducationField(index, 'institution', event.target.value)}
                      />
                    </label>
                    <label>
                      Location
                      <input
                        value={item.location}
                        onChange={(event) => updateEducationField(index, 'location', event.target.value)}
                      />
                    </label>
                    <label>
                      Start date
                      <input
                        value={item.startDate}
                        onChange={(event) => updateEducationField(index, 'startDate', event.target.value)}
                      />
                    </label>
                    <label>
                      End date
                      <input
                        value={item.endDate}
                        onChange={(event) => updateEducationField(index, 'endDate', event.target.value)}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="form-section">
            <div className="section-title-row">
              <div>
                <p className="section-label">Section</p>
                <h3>Skills</h3>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setCvData((current) => ({
                    ...current,
                    skills: [...current.skills, createEmptySkillItem()],
                  }))
                }
              >
                Add skill
              </button>
            </div>

            <div className="skill-editor-list">
              {cvData.skills.map((item, index) => (
                <label key={`${index}-${item.name}`} className="skill-chip-editor">
                  <span>Skill #{index + 1}</span>
                  <input value={item.name} onChange={(event) => updateSkillField(index, event.target.value)} />
                </label>
              ))}
            </div>
          </section>

          <div className="hero-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={previewLoading || templatesLoading || !selectedTemplateId}
            >
              {previewLoading ? 'Rendering preview...' : 'Generate preview'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void downloadPdf()}
              disabled={pdfLoading || templatesLoading || !selectedTemplateId}
            >
              {pdfLoading ? 'Exporting PDF...' : 'Export PDF'}
            </button>
          </div>

          {previewError ? <p className="status error">{previewError}</p> : null}
          {pdfError ? <p className="status error">{pdfError}</p> : null}
        </form>

        <section className="preview-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Preview</p>
              <h2>Backend-rendered HTML</h2>
            </div>
          </div>

          {previewHtml ? (
            <iframe title="CV preview" className="preview-frame" srcDoc={previewHtml} />
          ) : (
            <div className="preview-empty-state">
              <p>Preview appears here after backend render completes.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
