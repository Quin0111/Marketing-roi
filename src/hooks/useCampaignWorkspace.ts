import { SuggestedCampaign } from '../services/campaignSuggestions';
import { useState } from 'react';
import { Campaign, buildCampaign, campaignUpdateError, loadCampaigns, saveCampaigns } from '../services/campaigns';
import { MarketingScenario } from '../types';
import { MarketingContext } from '../services/marketingContext';
export function useCampaignWorkspace(){
 const [initial]=useState(()=>loadCampaigns());const [campaigns,setCampaigns]=useState(initial.campaigns);const [notice,setNotice]=useState(initial.notice);
 const commit=(next:Campaign[])=>{setCampaigns(next);if(initial.writable){const failure=saveCampaigns(next);setNotice(failure);}else setNotice(initial.notice);};
 const create=(scenario:Pick<MarketingScenario,'id'|'name'|'features'>,context:MarketingContext={},suggestion?:SuggestedCampaign)=>{const campaign=buildCampaign(scenario,context,suggestion);commit([...campaigns,campaign]);return campaign.id;};
 const update=(next:Campaign)=>{const previous=campaigns.find(c=>c.id===next.id);if(!previous)return 'Không tìm thấy chiến dịch.';const error=campaignUpdateError(previous,next);if(error)return error;commit(campaigns.map(c=>c.id===next.id?{...next,updatedAt:new Date().toISOString()}:c));return null;};
 const remove=(id:string)=>commit(campaigns.filter(c=>c.id!==id));
 return {campaigns,notice,create,update,remove};
}
export type CampaignWorkspace=ReturnType<typeof useCampaignWorkspace>;
