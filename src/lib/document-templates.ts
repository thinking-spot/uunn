export interface TemplateField {
    id: string;
    label: string;
    placeholder: string;
    type: 'text' | 'textarea';
    required?: boolean;
}

export interface DocumentTemplate {
    id: string;
    label: string;
    description: string;
    fields: TemplateField[];
    generateMarkdown: (title: string, values: Record<string, string>) => string;
}

function section(heading: string, content: string): string {
    if (!content.trim()) return '';
    return `## ${heading}\n${content.trim()}\n`;
}

export const TEMPLATES: DocumentTemplate[] = [
    {
        id: 'basic',
        label: 'Basic Template',
        description: 'General-purpose document with structured sections',
        fields: [
            { id: 'setting', label: 'Describe the setting', placeholder: 'Where and when is this taking place?', type: 'textarea' },
            { id: 'problem', label: 'Explain the problem', placeholder: 'What issue are workers facing?', type: 'textarea' },
            { id: 'solution', label: 'Explain the solution', placeholder: 'What solution do you propose?', type: 'textarea' },
            { id: 'ideal_outcome', label: 'Ideal outcome', placeholder: 'What does success look like?', type: 'textarea' },
            { id: 'proposed_action', label: 'Proposed action', placeholder: 'What specific steps should be taken?', type: 'textarea' },
            { id: 'parties', label: 'Parties involved', placeholder: 'Who is involved or affected?', type: 'text' },
            { id: 'timeline', label: 'Proposed timeline', placeholder: 'When should this be resolved?', type: 'text' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            section('Setting', v.setting || ''),
            section('Problem', v.problem || ''),
            section('Solution', v.solution || ''),
            section('Ideal Outcome', v.ideal_outcome || ''),
            section('Proposed Action', v.proposed_action || ''),
            section('Parties Involved', v.parties || ''),
            section('Proposed Timeline', v.timeline || ''),
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'collective-demand',
        label: 'Collective Workplace Demand',
        description: 'Letter to management signed by workers',
        fields: [
            { id: 'employer_name', label: 'Employer / Management name', placeholder: 'Name of employer or manager', type: 'text' },
            { id: 'demands', label: 'List of demands', placeholder: 'What are the specific demands? (one per line)', type: 'textarea', required: true },
            { id: 'justification', label: 'Justification for demands', placeholder: 'Why are these demands necessary?', type: 'textarea', required: true },
            { id: 'deadline', label: 'Response deadline', placeholder: 'e.g. April 15, 2026', type: 'text' },
            { id: 'signatories', label: 'Names of signing workers', placeholder: 'One name per line', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            `**To:** ${v.employer_name || '[Employer Name]'}\n`,
            `**Date:** ${new Date().toLocaleDateString()}\n`,
            section('Demands', v.demands || ''),
            section('Justification', v.justification || ''),
            v.deadline ? `## Response Deadline\n${v.deadline}\n` : '',
            section('Signatories', v.signatories || ''),
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'safety-grievance',
        label: 'Workplace Safety Grievance',
        description: 'Formal safety complaint with legal backing',
        fields: [
            { id: 'hazard_description', label: 'Describe the safety hazard', placeholder: 'What is the hazard and how does it endanger workers?', type: 'textarea', required: true },
            { id: 'location', label: 'Location of hazard', placeholder: 'e.g. Warehouse floor, Section B', type: 'text', required: true },
            { id: 'date_observed', label: 'Date first observed', placeholder: 'e.g. March 15, 2026', type: 'text' },
            { id: 'previous_reports', label: 'Previous reports or complaints', placeholder: 'Have prior complaints been filed? What was the response?', type: 'textarea' },
            { id: 'requested_remedy', label: 'Requested remedy', placeholder: 'What specific corrective action is needed?', type: 'textarea', required: true },
            { id: 'regulatory_references', label: 'Relevant OSHA or regulatory references', placeholder: 'Optional: cite specific OSHA standards or regulations', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            `**Date Filed:** ${new Date().toLocaleDateString()}\n`,
            section('Hazard Description', v.hazard_description || ''),
            v.location ? `## Location\n${v.location}\n` : '',
            v.date_observed ? `## Date First Observed\n${v.date_observed}\n` : '',
            section('Previous Reports', v.previous_reports || ''),
            section('Requested Remedy', v.requested_remedy || ''),
            section('Regulatory References', v.regulatory_references || ''),
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'petition',
        label: 'Petition for Policy Change',
        description: 'Petition with argument and signatures',
        fields: [
            { id: 'current_policy', label: 'Describe the current policy', placeholder: 'What policy exists today?', type: 'textarea', required: true },
            { id: 'proposed_change', label: 'Proposed change', placeholder: 'What should the new policy be?', type: 'textarea', required: true },
            { id: 'rationale', label: 'Rationale', placeholder: 'Why is this change needed?', type: 'textarea', required: true },
            { id: 'supporting_evidence', label: 'Supporting evidence or precedents', placeholder: 'Any data, examples, or precedents that support this change?', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# Petition: ${title}\n`,
            `**Date:** ${new Date().toLocaleDateString()}\n`,
            section('Current Policy', v.current_policy || ''),
            section('Proposed Change', v.proposed_change || ''),
            section('Rationale', v.rationale || ''),
            section('Supporting Evidence', v.supporting_evidence || ''),
            `## Signatures\n\n| # | Name | Date |\n|---|------|------|\n| 1 | | |\n| 2 | | |\n| 3 | | |\n`,
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'union-survey',
        label: 'Union Interest Survey',
        description: 'Anonymous survey to gauge interest',
        fields: [
            { id: 'survey_purpose', label: 'Purpose of the survey', placeholder: 'What are you trying to learn?', type: 'textarea', required: true },
            { id: 'questions', label: 'Survey questions', placeholder: 'One question per line', type: 'textarea', required: true },
            { id: 'anonymity_note', label: 'Anonymity guarantee statement', placeholder: 'e.g. All responses are anonymous and encrypted', type: 'text' },
            { id: 'response_deadline', label: 'Response deadline', placeholder: 'e.g. April 30, 2026', type: 'text' },
        ],
        generateMarkdown: (title, v) => {
            const questions = (v.questions || '').split('\n').filter(q => q.trim());
            const questionsList = questions.map((q, i) => `${i + 1}. ${q.trim()}`).join('\n');
            return [
                `# ${title}\n`,
                `**Date:** ${new Date().toLocaleDateString()}\n`,
                v.anonymity_note ? `> ${v.anonymity_note}\n` : '> All responses are anonymous and encrypted.\n',
                section('Purpose', v.survey_purpose || ''),
                `## Questions\n${questionsList || '[Add survey questions]'}\n`,
                v.response_deadline ? `## Response Deadline\n${v.response_deadline}\n` : '',
            ].filter(Boolean).join('\n');
        },
    },
    {
        id: 'meeting-request',
        label: 'Meeting Request',
        description: 'Professional meeting request to discuss issues',
        fields: [
            { id: 'recipient', label: 'Recipient', placeholder: 'Name and title of the person you are requesting a meeting with', type: 'text', required: true },
            { id: 'meeting_purpose', label: 'Purpose of the meeting', placeholder: 'What do you need to discuss?', type: 'textarea', required: true },
            { id: 'proposed_dates', label: 'Proposed date(s)', placeholder: 'e.g. April 10 or 11, 2026', type: 'text' },
            { id: 'proposed_location', label: 'Proposed location', placeholder: 'e.g. Conference Room B', type: 'text' },
            { id: 'attendees', label: 'Attendees', placeholder: 'One name per line', type: 'textarea' },
            { id: 'agenda_items', label: 'Agenda items', placeholder: 'One item per line', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => {
            const agenda = (v.agenda_items || '').split('\n').filter(a => a.trim());
            const agendaList = agenda.map((a, i) => `${i + 1}. ${a.trim()}`).join('\n');
            return [
                `# ${title}\n`,
                `**To:** ${v.recipient || '[Recipient]'}\n`,
                `**Date:** ${new Date().toLocaleDateString()}\n`,
                section('Purpose', v.meeting_purpose || ''),
                v.proposed_dates ? `## Proposed Date(s)\n${v.proposed_dates}\n` : '',
                v.proposed_location ? `## Location\n${v.proposed_location}\n` : '',
                section('Attendees', v.attendees || ''),
                agendaList ? `## Agenda\n${agendaList}\n` : '',
            ].filter(Boolean).join('\n');
        },
    },
    {
        id: 'delegation',
        label: 'Delegation of Representation',
        description: 'Authorize spokespersons',
        fields: [
            { id: 'delegator_names', label: 'Names of workers delegating', placeholder: 'One name per line', type: 'textarea', required: true },
            { id: 'representative_names', label: 'Names of authorized representatives', placeholder: 'One name per line', type: 'textarea', required: true },
            { id: 'scope', label: 'Scope of representation', placeholder: 'What matters are the representatives authorized to address?', type: 'textarea', required: true },
            { id: 'duration', label: 'Duration / effective period', placeholder: 'e.g. Until December 31, 2026', type: 'text' },
            { id: 'conditions', label: 'Any conditions or limitations', placeholder: 'Optional: specific restrictions on the delegation', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            `**Date:** ${new Date().toLocaleDateString()}\n`,
            section('Delegating Workers', v.delegator_names || ''),
            section('Authorized Representatives', v.representative_names || ''),
            section('Scope of Representation', v.scope || ''),
            v.duration ? `## Effective Period\n${v.duration}\n` : '',
            section('Conditions & Limitations', v.conditions || ''),
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'strike-notice',
        label: 'Strike Notice',
        description: 'Formal strike announcement (includes legal disclaimer)',
        fields: [
            { id: 'employer_name', label: 'Employer name', placeholder: 'Name of the employer', type: 'text', required: true },
            { id: 'strike_date', label: 'Planned strike date', placeholder: 'e.g. May 1, 2026', type: 'text', required: true },
            { id: 'strike_duration', label: 'Expected duration', placeholder: 'e.g. 24 hours, indefinite', type: 'text' },
            { id: 'reasons', label: 'Reasons for the strike', placeholder: 'Why is this action being taken?', type: 'textarea', required: true },
            { id: 'prior_negotiations', label: 'Summary of prior negotiations', placeholder: 'What negotiations or attempts at resolution have taken place?', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            `**To:** ${v.employer_name || '[Employer Name]'}\n`,
            `**Date Issued:** ${new Date().toLocaleDateString()}\n`,
            `**Planned Strike Date:** ${v.strike_date || '[TBD]'}\n`,
            v.strike_duration ? `**Expected Duration:** ${v.strike_duration}\n` : '',
            '',
            section('Reasons for Strike Action', v.reasons || ''),
            section('Prior Negotiations', v.prior_negotiations || ''),
            `---\n`,
            `**Legal Disclaimer:** This strike notice is issued in accordance with applicable labor laws. Workers have the right to engage in concerted activity under Section 7 of the National Labor Relations Act (NLRA). This notice is provided as a courtesy and does not constitute legal advice. Workers are encouraged to consult with a labor attorney regarding their specific rights and obligations. Employers are prohibited from retaliating against employees for exercising their protected rights under the NLRA.\n`,
        ].filter(Boolean).join('\n'),
    },
    {
        id: 'union-alliance',
        label: 'Union Alliance',
        description: 'Coordinate multi-union actions and communication',
        fields: [
            { id: 'alliance_name', label: 'Proposed alliance name', placeholder: 'e.g. Metro Workers Coalition', type: 'text', required: true },
            { id: 'participating_unions', label: 'Participating unions', placeholder: 'One union per line', type: 'textarea', required: true },
            { id: 'shared_objectives', label: 'Shared objectives', placeholder: 'What goals do the unions share?', type: 'textarea', required: true },
            { id: 'coordination_plan', label: 'Coordination plan', placeholder: 'How will the unions coordinate?', type: 'textarea' },
            { id: 'communication_channels', label: 'Communication channels to establish', placeholder: 'e.g. Shared encrypted channel, weekly calls', type: 'textarea' },
        ],
        generateMarkdown: (title, v) => [
            `# ${title}\n`,
            `**Alliance:** ${v.alliance_name || '[Alliance Name]'}\n`,
            `**Date:** ${new Date().toLocaleDateString()}\n`,
            section('Participating Unions', v.participating_unions || ''),
            section('Shared Objectives', v.shared_objectives || ''),
            section('Coordination Plan', v.coordination_plan || ''),
            section('Communication Channels', v.communication_channels || ''),
        ].filter(Boolean).join('\n'),
    },
];

export function getTemplate(id: string): DocumentTemplate | undefined {
    return TEMPLATES.find(t => t.id === id);
}

export const FORMALIZE_PROMPT = `You are a union attorney with experience at all levels of organizing. Review this hard-working person's draft of a document for collective action. Then, prepare a formalized version to be used for collective organizing under Section 7 of the National Labor Relations Act (NLRA) to engage in "concerted activity" -- acting together with co-workers to improve wages, benefits, or working conditions without a formal union. These rights include discussing pay, signing petitions, and organizing, and employers cannot legally retaliate for these actions.

Key Rights for Non-Union Employees (Section 7 Rights):
- Discussing Conditions: You have the right to talk with coworkers about wages, hours, and working conditions, including on social media.
- Concerted Activity: You can act together to improve your workplace, such as complaining to a manager as a group, even if no union exists.
- Distributing Information: You may distribute literature or wear union buttons/T-shirts in non-work areas during non-work time (e.g., break rooms).
- Protection from Retaliation: Employers cannot fire, discipline, or threaten employees for engaging in these protected activities.
- Weingarten Rights: While primarily for union members, some protections exist regarding having a coworker present during disciplinary interviews, though this is less robust without a union.

Instructions:
- Return the formalized document in clean markdown format.
- Use professional, legally sound language appropriate for formal labor communications.
- Preserve all factual details from the original draft.
- Add appropriate legal references and structure where applicable.
- Do NOT add legal advice disclaimers unless the document type warrants it (e.g., strike notices).
- Return ONLY the document content, no conversational filler.

--- DRAFT DOCUMENT ---
`;
