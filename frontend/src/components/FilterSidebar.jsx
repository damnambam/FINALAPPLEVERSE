import React, { useMemo } from "react";

const uniq = (list, key) => {
  if (!list || list.length === 0) return [];
  
  const uniqueValues = new Set();
  list.forEach(item => {
    const value = item?.[key];
    if (value && value !== 'null' && value !== null) {
      uniqueValues.add(String(value));
    }
  });
  
  return Array.from(uniqueValues).sort();
};

export default function FilterSidebar({ data, value, onChange, onReset }) {
  // Using actual MongoDB field names with spaces
  const acno = useMemo(() => uniq(data, "acno"), [data]);
  const accession = useMemo(() => uniq(data, "accession"), [data]);
  const countries = useMemo(() => uniq(data, "e origin country"), [data]);
  const provinces = useMemo(() => uniq(data, "e origin province"), [data]);
  const cities = useMemo(() => uniq(data, "e origin city"), [data]);
  const pedigrees = useMemo(() => uniq(data, "e pedigree"), [data]);

  const Field = ({ label, name, options }) => (
    <div className="f-field">
      <div className="f-label">{label}</div>
      <div className="f-select">
        <select 
          value={value[name] || ""} 
          onChange={(e) => onChange({ ...value, [name]: e.target.value })}
        >
          <option value="">All</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="filters-card">
      <div className="filters-title-row">
        <h3>Filters</h3>
        <button className="reset" onClick={onReset}>
          Reset All
        </button>
      </div>
      <Field label="ACNO" name="acno" options={acno} />
      <Field label="ACCESSION" name="accession" options={accession} />
      <Field label="ORIGIN COUNTRY" name="country" options={countries} />
      <Field label="ORIGIN PROVINCE" name="province" options={provinces} />
      <Field label="ORIGIN CITY" name="city" options={cities} />
      <Field label="E PEDIGREE" name="pedigree" options={pedigrees} />
    </div>
  );
}