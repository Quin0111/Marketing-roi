import {createServer} from 'vite';
import {writeFileSync} from 'node:fs';
const server=await createServer({server:{middlewareMode:true,hmr:false,watch:null},appType:'custom'});
try{
 const {createCampaignSuggestions}=await server.ssrLoadModule('/src/services/campaignSuggestions.ts');
 const examples=[
  ['fashion','awareness','Instagram','Social Media','Women 25-34','Fashionistas',30],
  ['technology','leads','Google Ads','Search','All Ages','Tech Enthusiasts',30],
  ['education','leads','Facebook','Social Media','All Ages','Tech Enthusiasts',45],
  ['food','launch','Instagram','Social Media','All Ages','Foodies',15],
  ['services','conversion','Website','Display','All Ages','Health & Wellness',60],
  ['other','awareness','Email','Email','All Ages','Outdoor Adventurers',30],
  ['technology','launch','YouTube','Social Media','All Ages','Tech Enthusiasts',30],
  ['fashion','awareness','Instagram','Influencer','Women 25-34','Fashionistas',30],
 ].map(([industry,goal,channelUsed,campaignType,targetAudience,customerSegment,durationDays])=>{
  const features={campaignType,channelUsed,targetAudience,customerSegment,durationDays},context={industry,goal};
  return {fixture:true,features,context,...createCampaignSuggestions(features,context,['Kênh được người dùng chọn làm tiêu chí; ví dụ template, không phải nghiên cứu hiệu quả.'])};
 });
 writeFileSync('research/phase5/run_campaign_suggestions/rule_examples.json',JSON.stringify({source:'Actual service via Vite SSR; illustrative inputs, not measured campaigns',examples},null,2));
 console.log(JSON.stringify({examples:examples.length,campaignCounts:examples.map(e=>e.campaigns.length)}));
}finally{await server.close();}
