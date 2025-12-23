
import { services as serviceOptions } from "../../pages/ServicesPage";

export const generateServicesHtml = (selectedServices: string[] = [], templateId: string = 'modern') => {
  if (selectedServices.length === 0) {
    return '';
  }
  
  // Different styling based on template
  let sectionTitleStyle = '';
  let serviceCardStyle = '';
  let serviceTitleStyle = '';
  let serviceItemStyle = '';
  let footerStyle = '';
  
  switch(templateId) {
    case 'bold':
      sectionTitleStyle = 'text-align:center; font-size:26px; font-weight:600; margin-bottom:24px; text-transform:uppercase; letter-spacing:1px;';
      serviceCardStyle = 'border:none; border-bottom:3px solid #FF719A; border-radius:0px; padding:24px; background-color:#f8f8f8;';
      serviceTitleStyle = 'font-size:20px; font-weight:600; margin-bottom:18px; color:#222; text-transform:uppercase;';
      serviceItemStyle = 'color:#444; font-size:15px; padding-left:20px; line-height:1.6; margin-bottom:8px;';
      footerStyle = 'text-align:center; font-size:14px; color:#555; margin-top:24px; font-weight:500;';
      break;
    case 'classic':
      sectionTitleStyle = 'text-align:center; font-size:28px; font-weight:400; margin-bottom:26px; font-family:serif; border-bottom:1px solid #e0e0e0; padding-bottom:15px;';
      serviceCardStyle = 'border:1px solid #e0e0e0; border-radius:0px; padding:24px; background-color:#fafafa;';
      serviceTitleStyle = 'font-size:22px; font-weight:400; margin-bottom:16px; color:#333; font-family:serif; border-bottom:1px dotted #ccc; padding-bottom:8px;';
      serviceItemStyle = 'color:#555; font-size:15px; padding-left:20px; line-height:1.7; margin-bottom:6px; font-family:serif;';
      footerStyle = 'text-align:center; font-size:15px; color:#666; margin-top:24px; font-style:italic; font-family:serif;';
      break;
    case 'modern':
    default:
      sectionTitleStyle = 'text-align:center; font-size:24px; font-weight:300; margin-bottom:20px;';
      serviceCardStyle = 'border:1px solid #e2e8f0; border-radius:8px; padding:20px;';
      serviceTitleStyle = 'font-size:18px; font-weight:500; margin-bottom:15px;';
      serviceItemStyle = 'color:#666; font-size:14px; padding-left:20px;';
      footerStyle = 'text-align:center; font-size:14px; color:#666; margin-top:20px;';
  }
  
  let servicesHtml = `
    <div style="margin-bottom:30px;">
      <h2 style="${sectionTitleStyle}">SERVICES</h2>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
  `;
  
  // Regular service packages
  selectedServices
    .filter(serviceKey => !serviceKey.startsWith('addon:'))
    .forEach(serviceKey => {
      const service = serviceOptions[serviceKey];
      if (service) {
        servicesHtml += `
          <div style="${serviceCardStyle}">
            <h3 style="${serviceTitleStyle}">${service.title}</h3>
            <ul style="padding-left:0; list-style-position:inside;">
              ${service.items.map(item => `<li style="${serviceItemStyle}">${item}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    });
  
  // Individual selected addons
  const selectedAddons = selectedServices.filter(key => key.startsWith('addon:'));
  if (selectedAddons.length > 0) {
    servicesHtml += `
      <div style="${serviceCardStyle}">
        <h3 style="${serviceTitleStyle}">${serviceOptions.addons?.title || "Optional Addons"}</h3>
        <ul style="padding-left:0; list-style-position:inside;">
          ${selectedAddons.map(key => {
            const addonItem = key.replace('addon:', '');
            return `<li style="${serviceItemStyle}">${addonItem}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }
  
  servicesHtml += `
      </div>
      <div style="${footerStyle}">
        <p>TailorMade - Customised as per clients requirement</p>
      </div>
    </div>
  `;
  
  return servicesHtml;
};
