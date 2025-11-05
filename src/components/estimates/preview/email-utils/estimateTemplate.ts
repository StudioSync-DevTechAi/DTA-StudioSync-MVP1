interface Package {
  name?: string;
  amount: string;
  services?: Array<{
    event: string;
    date: string;
    photographers: string;
    cinematographers: string;
  }>;
  deliverables?: string[];
}

export const applyTemplateStyles = (html: string, templateId: string = 'modern') => {
  let headerClass = '';
  let contentClass = '';
  let headingClass = '';
  let containerClass = '';
  let cardClass = '';
  let buttonClass = '';
  let separatorClass = '';
  let fontFamily = 'font-family: system-ui, -apple-system, sans-serif;';
  
  switch(templateId) {
    case 'bold':
      headerClass = 'background-color:#222222; color:#ffffff; padding:36px 0; text-transform:uppercase;';
      contentClass = 'border-left:4px solid #FF719A; padding-left:20px; margin-bottom:24px;';
      headingClass = 'font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#222222;';
      containerClass = 'background-color:#f9f9f9; border-radius:0;';
      cardClass = 'border:none; border-bottom:3px solid #FF719A; border-radius:0; box-shadow:0 4px 8px rgba(0,0,0,0.1);';
      buttonClass = 'background-color:#FF719A; color:#ffffff; font-weight:bold; text-transform:uppercase; border-radius:0;';
      separatorClass = 'height:3px; background-color:#FF719A;';
      fontFamily = 'font-family: "Montserrat", sans-serif;';
      break;
      
    case 'classic':
      headerClass = 'background-color:#f7f7f7; color:#333333; padding:28px 0; border-bottom:2px solid #e0e0e0;';
      contentClass = 'border-bottom:1px solid #e0e0e0; padding-bottom:24px; margin-bottom:24px;';
      headingClass = 'font-family:serif; font-size:22px; color:#333333; font-weight:500;';
      containerClass = 'background-color:#ffffff; border:1px solid #e0e0e0; border-radius:8px;';
      cardClass = 'border:1px solid #e0e0e0; border-radius:8px; background-color:#ffffff;';
      buttonClass = 'background-color:#4A6FA5; color:#ffffff; font-family:serif; border-radius:4px;';
      separatorClass = 'height:1px; background-color:#e0e0e0;';
      fontFamily = 'font-family: "Playfair Display", Georgia, serif;';
      break;
      
    case 'modern':
    default:
      headerClass = 'background: linear-gradient(109.6deg, rgba(223,234,247,1) 11.2%, rgba(244,248,252,1) 91.1%); color:#333333; padding:24px 0;';
      contentClass = 'margin-bottom:24px; background-color:#ffffff; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);';
      headingClass = 'font-weight:500; color:#1a73e8; border-bottom:1px solid #f0f0f0; padding-bottom:8px;';
      containerClass = 'background-color:#f8f9fa; border-radius:12px;';
      cardClass = 'border:1px solid #f0f0f0; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); background-color:#ffffff;';
      buttonClass = 'background: linear-gradient(90deg, #1a73e8, #6ba4f7); color:#ffffff; font-weight:500; border-radius:24px;';
      separatorClass = 'height:1px; background: linear-gradient(90deg, #1a73e8, #6ba4f7);';
      fontFamily = 'font-family: "Inter", system-ui, sans-serif;';
  }
  
  let styledHtml = html.replace(
    '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">',
    `<div style="${fontFamily} max-width: 800px; margin: 0 auto; padding: 20px; ${containerClass}">`
  );
  
  styledHtml = styledHtml.replace(
    '<div style="text-align:center; margin-bottom:30px;">',
    `<div style="text-align:center; margin-bottom:30px; ${headerClass}">`
  );
  
  styledHtml = styledHtml.replace(/<h([1-6])(.*?)>/g, `<h$1$2 style="${headingClass}">`);
  
  styledHtml = styledHtml.replace(
    '<div style="display:inline-block; background:#f1f5f9; color:#374151; padding:4px 12px; border-radius:9999px; font-size:14px; margin-top:10px;">',
    `<div style="display:inline-block; ${buttonClass} padding:4px 16px; font-size:14px; margin-top:10px;">`
  );
  
  styledHtml = styledHtml.replace(
    /<div style="border:1px solid #e2e8f0; border-radius:8px; padding:(16|20|24)px; margin-bottom:(16|20|24)px;">/g,
    `<div style="${cardClass} padding:$1px; margin-bottom:$2px;">`
  );
  
  styledHtml = styledHtml.replace(
    /<div style="margin-bottom:(16|20|24)px;">/g,
    `<div style="margin-bottom:$1px; ${contentClass}">`
  );
  
  styledHtml = styledHtml.replace(
    /<div style="border-top:1px solid #e2e8f0; padding-top:16px;/g,
    `<div style="border-top:none; ${separatorClass} padding-top:16px;`
  );
  
  return styledHtml;
};

export const generateEstimateDetailsHtml = (estimate: {
  id: string;
  clientName: string;
  date: string;
  amount: string;
  selectedServices?: string[];
  selectedPackageIndex?: number;
  services?: Array<{
    event: string;
    date: string;
    photographers: string;
    cinematographers: string;
  }>;
  deliverables?: string[];
  packages?: Array<Package>;
  terms?: string[];
  selectedTemplate?: string;
}) => {
  const hasPackages = estimate.packages && estimate.packages.length > 0;
  
  const legacyPackage = {
    name: "Standard Package",
    amount: estimate.amount,
    services: estimate.services || [],
    deliverables: estimate.deliverables || []
  };
  
  const packagesToRender = hasPackages ? estimate.packages : [legacyPackage];
  
  const defaultTerms = [
    "This estimate is valid for 30 days from the date of issue.",
    "A 50% advance payment is required to confirm the booking.",
    "The balance payment is due before the event date."
  ];
  
  const termsToDisplay = estimate.terms && estimate.terms.length > 0 ? estimate.terms : defaultTerms;

  let estimateHtml = `
    <div style="border:1px solid #e2e8f0; border-radius:8px; padding:24px; margin-bottom:30px;">
      <div style="text-align:center; margin-bottom:20px;">
        <h2 style="font-size:24px; font-weight:600; margin-bottom:10px;">ESTIMATE</h2>
        <p style="color:#666;">StudioSyncWork Photography Services</p>
        <div style="display:inline-block; background:#f1f5f9; color:#374151; padding:4px 12px; border-radius:9999px; font-size:14px; margin-top:10px;">
          Status: Pending
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:16px; margin-bottom:16px;">
        <div>
          <h3 style="font-weight:500;">Client</h3>
          <p>${estimate.clientName}</p>
          <p style="font-size:14px; color:#666;">Date: ${new Date(estimate.date).toLocaleDateString()}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-weight:500;">Estimate #${estimate.id}</h3>
          <p style="font-size:14px; color:#666;">Valid until: ${new Date(new Date(estimate.date).getTime() + 30*24*60*60*1000).toLocaleDateString()}</p>
        </div>
      </div>
  `;

  packagesToRender.forEach((pkg, packageIndex) => {
    estimateHtml += `
      <div style="border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
        <h3 style="font-size:18px; font-weight:500; margin-bottom:16px;">
          ${hasPackages ? `Package Option ${packageIndex + 1}${pkg.name ? `: ${pkg.name}` : ''}` : 'Package Details'}
        </h3>
        
        ${pkg.services && pkg.services.length > 0 ? `
          <div style="margin-bottom:16px;">
            <h4 style="font-weight:500; margin-bottom:8px;">Services</h4>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <th style="text-align:left; padding:8px 4px;">Event</th>
                  <th style="text-align:left; padding:8px 4px;">Date</th>
                  <th style="text-align:left; padding:8px 4px;">Photographers</th>
                  <th style="text-align:left; padding:8px 4px;">Cinematographers</th>
                </tr>
              </thead>
              <tbody>
                ${pkg.services.map(service => `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:8px 4px;">${service.event}</td>
                    <td style="padding:8px 4px;">${new Date(service.date).toLocaleDateString()}</td>
                    <td style="padding:8px 4px;">${service.photographers}</td>
                    <td style="padding:8px 4px;">${service.cinematographers}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${pkg.deliverables && pkg.deliverables.length > 0 ? `
          <div style="margin-bottom:16px;">
            <h4 style="font-weight:500; margin-bottom:8px;">Deliverables</h4>
            <ul style="list-style-type:disc; margin-left:20px;">
              ${Array.isArray(pkg.deliverables) ? pkg.deliverables.map(deliverable => `<li>${deliverable}</li>`).join('') : ''}
            </ul>
          </div>
        ` : ''}

        <div style="text-align:right; padding-top:8px; border-top:1px solid #e2e8f0;">
          <span style="font-weight:500;">Package Total: </span>
          <span style="font-size:18px; font-weight:600;">${pkg.amount}</span>
        </div>
      </div>
    `;
  });

  estimateHtml += `
      <div style="border-top:1px solid #e2e8f0; padding-top:16px; font-size:14px; color:#666;">
        <p>Terms & Conditions</p>
        <ul style="list-style-type:disc; margin-left:20px; margin-top:8px;">
          ${termsToDisplay.map(term => `<li>${term}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  return applyTemplateStyles(estimateHtml, estimate.selectedTemplate);
};
