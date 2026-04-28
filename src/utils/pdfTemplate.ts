export interface PdfTemplateData {
  projectName: string;
  version: string;
  date: string;
  model: string;
  totalScore: number;
  changedItems: Array<{ title: string; status: string }>;
  dimensionScores: Record<string, { score: number; detail: string }> | null;
  radarImageDataURL: string | null;
  issues: Array<{
    description: string;
    affected_card: { item_id: number; title: string; snippet: string } | null;
    references: Array<{ type: string; name: string; snippet: string; priority: string }>;
  }>;
  suggestions: string;
  standardsCount: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  completeness: '完整性',
  correctness: '正确性',
  unambiguity: '无歧义性',
  feasibility: '可行性',
  verifiability: '可验证性',
  traceability: '可跟踪性',
};

const DIMENSION_ORDER = [
  'completeness',
  'correctness',
  'unambiguity',
  'feasibility',
  'verifiability',
  'traceability',
];

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ea580c';
  return '#dc2626';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return '#f0fdf4';
  if (score >= 60) return '#fff7ed';
  return '#fef2f2';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '优秀';
  if (score >= 60) return '及格';
  return '待改进';
}

function getStatusBadge(status: string): { text: string; bg: string; color: string } {
  if (status === 'new') return { text: '新增', bg: '#dcfce7', color: '#166534' };
  if (status === 'modified') return { text: '修改', bg: '#ffedd5', color: '#9a3412' };
  if (status === 'deleted') return { text: '删除', bg: '#fee2e2', color: '#991b1b' };
  return { text: status, bg: '#f3f4f6', color: '#374151' };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHeader(data: PdfTemplateData): string {
  const scoreColor = getScoreColor(data.totalScore);
  const scoreLabel = getScoreLabel(data.totalScore);
  return `
    <div style="background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 100%); padding: 32px 40px; border-radius: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
            ${escapeHtml(data.projectName)}
          </h1>
          <div style="font-size: 11px; color: rgba(255,255,255,0.6); line-height: 1.6;">
            需求可测试性评估报告<br/>
            版本: ${escapeHtml(data.version)} &nbsp;|&nbsp; 评估时间: ${escapeHtml(data.date)} &nbsp;|&nbsp; 使用模型: ${escapeHtml(data.model)} &nbsp;|&nbsp; 选用标准: ${data.standardsCount} 项
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-weight: 700;">总体评分</div>
          <div style="display: inline-block; padding: 4px 12px; border-radius: 6px; background: rgba(255,255,255,0.1); font-size: 11px; font-weight: 700; color: ${scoreColor}; margin-bottom: 6px;">
            ${scoreLabel}
          </div>
          <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">
            ${data.totalScore}
          </div>
        </div>
      </div>
    </div>`;
}

function renderChangedItems(data: PdfTemplateData): string {
  if (!data.changedItems || data.changedItems.length === 0) return '';

  const rows = data.changedItems
    .map((item) => {
      const badge = getStatusBadge(item.status);
      return `
        <tr>
          <td style="padding: 8px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #f3f4f6;">
            ${escapeHtml(item.title)}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 10px; font-size: 10px; font-weight: 700; background: ${badge.bg}; color: ${badge.color};">
              ${badge.text}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <div style="margin-top: 28px;">
      <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
        变更需求概览
      </h2>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">
              需求标题
            </th>
            <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; width: 80px;">
              状态
            </th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderDimensions(data: PdfTemplateData): string {
  if (!data.dimensionScores) return '';

  const cards = DIMENSION_ORDER.map((key) => {
    const dim = data.dimensionScores![key];
    if (!dim) return '';
    const label = DIMENSION_LABELS[key] || key;
    const scoreColor = getScoreColor(dim.score);
    const scoreBg = getScoreBgColor(dim.score);
    return `
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 13px; font-weight: 700; color: #334155;">${label}</span>
          <span style="display: inline-block; font-size: 22px; font-weight: 900; color: ${scoreColor}; background: ${scoreBg}; padding: 2px 14px; border-radius: 8px;">
            ${dim.score}
          </span>
        </div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.7;">
          ${escapeHtml(dim.detail)}
        </div>
      </div>`;
  }).join('');

  return `
    <div style="margin-top: 28px;">
      <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
        六维度诊断
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
        ${cards}
      </div>
    </div>`;
}

function renderRadarChart(data: PdfTemplateData): string {
  if (!data.radarImageDataURL) return '';

  return `
    <div style="margin-top: 28px; text-align: center;">
      <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; text-align: left;">
        雷达图
      </h2>
      <img src="${data.radarImageDataURL}" style="max-width: 400px; width: 100%; height: auto;" />
    </div>`;
}

function renderIssues(data: PdfTemplateData): string {
  if (!data.issues || data.issues.length === 0) return '';

  const cards = data.issues
    .map((issue, index) => {
      const affectedCardHtml = issue.affected_card
        ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-top: 10px;">
          <div style="font-size: 10px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            关联需求
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 4px;">
            ${escapeHtml(issue.affected_card.title)}
          </div>
          <div style="font-size: 11px; color: #78350f; line-height: 1.6; background: #fef3c7; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #f59e0b;">
            ${escapeHtml(issue.affected_card.snippet)}
          </div>
        </div>`
        : '';

      const referencesHtml =
        issue.references && issue.references.length > 0
          ? `
        <div style="margin-top: 10px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            引用来源
          </div>
          ${issue.references
            .map((ref) => {
              const isSmell = ref.type === 'smell';
              const typeBadgeBg = isSmell ? '#fee2e2' : '#dbeafe';
              const typeBadgeColor = isSmell ? '#991b1b' : '#1e40af';
              const typeBadgeText = isSmell ? '异味' : '标准';
              const nameColor = isSmell ? '#b91c1c' : '#1d4ed8';
              const refBorderBg = isSmell ? '#fef2f2' : '#eff6ff';
              const refBorderColor = isSmell ? '#fecaca' : '#bfdbfe';

              const priorityTag =
                isSmell && ref.priority
                  ? (() => {
                      let pBg = '#fef3c7';
                      let pColor = '#92400e';
                      let pText = '一般';
                      if (ref.priority === 'high') {
                        pBg = '#fee2e2';
                        pColor = '#991b1b';
                        pText = '严重';
                      } else if (ref.priority === 'low') {
                        pBg = '#f1f5f9';
                        pColor = '#475569';
                        pText = '轻微';
                      }
                      return `<span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; background: ${pBg}; color: ${pColor}; margin-left: 6px;">${pText}</span>`;
                    })()
                  : '';

              return `
              <div style="display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px; background: ${refBorderBg}; border: 1px solid ${refBorderColor}; margin-bottom: 6px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; background: ${typeBadgeBg}; color: ${typeBadgeColor}; white-space: nowrap; flex-shrink: 0;">
                  ${typeBadgeText}
                </span>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 11px; font-weight: 600; color: ${nameColor}; margin-bottom: 2px;">
                    ${escapeHtml(ref.name)}${priorityTag}
                  </div>
                  <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                    ${escapeHtml(ref.snippet)}
                  </div>
                </div>
              </div>`;
            })
            .join('')}
        </div>`
          : '';

      return `
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; page-break-inside: avoid;">
          <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #fee2e2; color: #dc2626; flex-shrink: 0;">
              ${(index + 1).toString().padStart(2, '0')}
            </span>
            <div style="font-size: 12px; font-weight: 600; color: #1e293b; line-height: 1.5;">
              ${escapeHtml(issue.description.split(/[。！？]/)[0])}
            </div>
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.7; background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid #f1f5f9; white-space: pre-wrap;">
            ${escapeHtml(issue.description)}
          </div>
          ${affectedCardHtml}
          ${referencesHtml}
        </div>`;
    })
    .join('');

  return `
    <div style="margin-top: 28px;">
      <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
        发现的缺陷 (${data.issues.length})
      </h2>
      ${cards}
    </div>`;
}

function renderSuggestions(data: PdfTemplateData): string {
  if (!data.suggestions) return '';

  return `
    <div style="margin-top: 28px;">
      <h2 style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #1e293b; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
        优化改进建议
      </h2>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px;">
        <div style="font-size: 12px; color: #166534; line-height: 1.8; white-space: pre-wrap; font-style: italic;">
          ${escapeHtml(data.suggestions)}
        </div>
      </div>
    </div>`;
}

export function generatePdfTemplate(data: PdfTemplateData): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=794" />
  <title>${escapeHtml(data.projectName)} - 评估报告</title>
</head>
<body style="margin: 0; padding: 0; background: #ffffff; font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <div style="width: 794px; margin: 0 auto; background: #ffffff;">
    ${renderHeader(data)}
    <div style="padding: 0 40px 40px 40px;">
      ${renderChangedItems(data)}
      ${renderDimensions(data)}
      ${renderRadarChart(data)}
      ${renderIssues(data)}
      ${renderSuggestions(data)}
    </div>
    <div style="padding: 16px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <div style="font-size: 10px; color: #94a3b8;">
        本报告由需求可测试性评估系统自动生成 &nbsp;|&nbsp; ${escapeHtml(data.date)}
      </div>
    </div>
  </div>
</body>
</html>`;
}
