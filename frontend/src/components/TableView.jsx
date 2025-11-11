import React from "react";

export default function TableView({ rows }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ACNO</th><th>ACCESSION</th><th>CULTIVAR NAME</th>
            <th>E ORIGIN COUNTRY</th><th>E ORIGIN PROVINCE</th><th>E ORIGIN CITY</th>
            <th>E PEDIGREE</th><th>E GENUS</th><th>E SPECIES</th>
          </tr>
        </thead>
        <tbody>
          {rows?.length ? rows.map((r, i) => (
            <tr key={i}>
              <td>{r?.ACNO}</td>
              <td>{r?.ACCESSION}</td>
              <td>{r?.CULTIVAR_NAME}</td>
              <td>{r?.E_ORIGIN_COUNTRY}</td>
              <td>{r?.E_ORIGIN_PROVINCE}</td>
              <td>{r?.E_ORIGIN_CITY}</td>
              <td>{r?.E_PEDIGREE}</td>
              <td>{r?.E_GENUS}</td>
              <td>{r?.E_SPECIES}</td>
            </tr>
          )) : <tr><td colSpan="9" className="empty">No results.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
