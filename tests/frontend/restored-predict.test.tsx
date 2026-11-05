import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import http from '../../backend/tests/http_results.json';
import { parseModelInfo } from '../../src/services/modelInfoService';
import { INPUT_FIELDS } from '../../src/services/campaignInput';
import { PredictionForm } from '../../src/components/prediction/PredictionForm';
const info=parseModelInfo(http.responses.find(r=>r.endpoint==='/model-info')!.response);
const props=()=>({onSubmit:vi.fn(),onSave:vi.fn(()=>null),onChange:vi.fn(),onReset:vi.fn(),isLoading:false,modelInfo:info});
describe('restored Predict option UI and exact metadata boundary',()=>{
 it('uses exactly four native dropdowns, metadata options and four duration buttons with a Vietnamese summary',()=>{
  const p=props();render(<PredictionForm {...p}/>);
  expect(screen.getAllByRole('combobox')).toHaveLength(4);
  for(const {api,label} of INPUT_FIELDS){
   const field=screen.getByLabelText(new RegExp(label));expect(field.tagName).toBe('SELECT');
   expect(within(field).getAllByRole('option').map(o=>(o as HTMLOptionElement).value).filter(Boolean)).toEqual(info.allowed_categories[api]);
  }
  expect(screen.queryByRole('textbox')).toBeNull();expect(screen.queryByRole('spinbutton')).toBeNull();
  for(const d of [15,30,45,60])expect(screen.getByRole('button',{name:`${d} ngày`,exact:true})).toBeEnabled();
  expect(screen.getByRole('button',{name:'30 ngày',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByTestId('prediction-config-summary')).toHaveTextContent('Quảng cáo tìm kiếm');
  expect(screen.getByTestId('prediction-config-summary')).toHaveTextContent('30 ngày');
 });
 it.each(INPUT_FIELDS)('blocks incomplete $api even if a submit is dispatched directly',({label,key,api})=>{
  const p=props();const {container}=render(<PredictionForm {...p}/>);const select=screen.getByLabelText(new RegExp(label));
  fireEvent.change(select,{target:{value:''}});expect(screen.getByRole('button',{name:'Dự đoán ROI',exact:true})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Lưu kịch bản để lập kế hoạch'})).toBeDisabled();
  fireEvent.submit(container.querySelector('form')!);expect(p.onSubmit).not.toHaveBeenCalled();
  fireEvent.change(select,{target:{value:info.allowed_categories[api][0]}});
  fireEvent.submit(container.querySelector('form')!);expect(p.onSubmit).toHaveBeenCalledWith(expect.objectContaining({[key]:info.allowed_categories[api][0]}));
 });
 it('does not silently replace a selection excluded by refreshed metadata and never shows hardcoded fallback options',()=>{
  const p=props();const v=render(<PredictionForm {...p}/>);
  v.rerender(<PredictionForm {...p} modelInfo={{...info,allowed_categories:{...info.allowed_categories,Campaign_Type:['Email']},allowed_duration_days:[15]}}/>);
  const field=screen.getByLabelText(/1. Loại chiến dịch/);expect(field).toHaveValue('');
  expect(within(field).queryByRole('option',{name:'Quảng cáo tìm kiếm'})).toBeNull();
  expect(screen.getByRole('button',{name:'30 ngày',exact:true})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Dự đoán ROI',exact:true})).toBeDisabled();
  expect(p.onChange).not.toHaveBeenCalled();expect(p.onSubmit).not.toHaveBeenCalled();
  fireEvent.change(field,{target:{value:'Email'}});fireEvent.click(screen.getByRole('button',{name:'15 ngày',exact:true}));
  fireEvent.click(screen.getByRole('button',{name:'Dự đoán ROI',exact:true}));
  expect(p.onSubmit).toHaveBeenCalledWith(expect.objectContaining({campaignType:'Email',durationDays:15}));
 });
 it('does not offer unverified choices or allow prediction when metadata is absent',()=>{
  const p=props();render(<PredictionForm {...p} modelInfo={null}/>);
  for(const field of screen.getAllByRole('combobox')){expect(field).toBeDisabled();expect(within(field).getAllByRole('option')).toHaveLength(1);}
  for(const d of [15,30,45,60])expect(screen.getByRole('button',{name:`${d} ngày`,exact:true})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Dự đoán ROI',exact:true})).toBeDisabled();expect(p.onSubmit).not.toHaveBeenCalled();
 });
 it('saves the selected configuration, updates the summary, and resets without invoking prediction',()=>{
  const p=props();render(<PredictionForm {...p}/>);
  fireEvent.change(screen.getByLabelText(/2. Kênh Marketing/),{target:{value:'Instagram'}});
  fireEvent.click(screen.getByRole('button',{name:'60 ngày',exact:true}));
  expect(screen.getByTestId('prediction-config-summary')).toHaveTextContent('Instagram');
  expect(screen.getByTestId('prediction-config-summary')).toHaveTextContent('60 ngày');
  fireEvent.click(screen.getByRole('button',{name:'Lưu kịch bản để lập kế hoạch'}));
  expect(p.onSave).toHaveBeenCalledWith(expect.objectContaining({channelUsed:'Instagram',durationDays:60}));expect(p.onSubmit).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Làm mới',exact:true}));expect(p.onReset).toHaveBeenCalledOnce();
  expect(screen.getByLabelText(/2. Kênh Marketing/)).toHaveValue('Google Ads');expect(screen.getByRole('button',{name:'30 ngày',exact:true})).toHaveAttribute('aria-pressed','true');
 });
});
