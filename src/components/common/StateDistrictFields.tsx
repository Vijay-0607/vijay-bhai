import { translateUi } from '../../locales/translateUi';
import { INDIAN_STATES_AND_UTS, KARNATAKA_DISTRICTS } from '../../data/indiaLocations';

interface StateDistrictFieldsProps {
  state: string;
  district: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
}

const fieldClass = 'mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950';

export function StateDistrictFields({ state, district, onStateChange, onDistrictChange }: StateDistrictFieldsProps) {
  const isKarnataka = state === 'Karnataka';
  return <>
    <label className="text-sm font-semibold">{translateUi("State")}<select required value={state} onChange={(event) => onStateChange(event.target.value)} className={fieldClass}><option value="" disabled>{translateUi("Select a state or union territory")}</option>{INDIAN_STATES_AND_UTS.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
    <label className="text-sm font-semibold">{translateUi('District')}{isKarnataka ? <select required value={district} onChange={(event) => onDistrictChange(event.target.value)} className={fieldClass}><option value="" disabled>{translateUi("Select a district")}</option>{KARNATAKA_DISTRICTS.map((name) => <option key={name} value={name}>{name}</option>)}</select> : <input required value={district} onChange={(event) => onDistrictChange(event.target.value)} placeholder={translateUi("Enter district")} className={fieldClass} />}</label>
  </>;
}
