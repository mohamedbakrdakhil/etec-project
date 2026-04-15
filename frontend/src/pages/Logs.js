import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/dashboard/logs', { params: { page, limit: 50 } });
        setLogs(res.data.logs);
        setTotal(res.data.total);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, [page]);

  return (
    <div>
      <div className="page-header">
        <h2>Logs Système</h2>
        <span className="badge badge-gray">{total} entrées</span>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Action</th>
                <th>Détails</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="text-sm">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  <td>{l.nom ? `${l.nom} ${l.prenom}` : '—'}</td>
                  <td>{l.role ? <span className="badge badge-gray">{l.role}</span> : '—'}</td>
                  <td><strong>{l.action}</strong></td>
                  <td className="text-sm text-muted">{l.details || '—'}</td>
                  <td className="text-sm">{l.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {total > 50 && (
        <div className="flex justify-between items-center" style={{marginTop: 16}}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span className="text-sm text-muted">Page {page}</span>
          <button className="btn btn-outline btn-sm" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}
    </div>
  );
};

export default Logs;
