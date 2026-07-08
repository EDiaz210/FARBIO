import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useTablaCodigos } from '../../hooks/useTablaCodigos';

const PHONE_FONT_LINK = 'https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap';
const CSV_HEADERS = ['ID', 'SAP Code', 'Status', 'Descripción SAP', 'Fecha', 'Creador'];

const downloadCsv = (content, fileName) => {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', fileName);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const toHistoryLines = (history) => {
	if (!history) return [];
	if (Array.isArray(history)) return history;
	if (typeof history === 'string') return [history];
	return [JSON.stringify(history)];
};

const getFecha = (entry) => {
	if (!entry) return '';
	if (typeof entry === 'string') return entry;
	if (typeof entry === 'object') return entry.fecha  || '';
	return String(entry);
};

const getCreador = (entry) => {
	if (!entry) return '';
	if (typeof entry === 'string') return entry;
	if (typeof entry === 'object') return entry.usuario || '';
	return String(entry);
};

const formatHistoryRows = (history) => {
	const rows = toHistoryLines(history);
	return rows.map((entry) => ({ fecha: getFecha(entry), creador: getCreador(entry) }));
};

const createCsvContent = (items) => {
	const rows = items.map((item) => {
		const historyRows = formatHistoryRows(item.r_sap_descomprimido);
		const fechas = historyRows.map((row) => row.fecha).filter(Boolean).join(' | ');
		const creadores = historyRows.map((row) => row.creador).filter(Boolean).join(' | ');
		return [
			item.id,
			item.codigo || '---',
			item.status || '',
			item.descripcion_sap || '',
			fechas,
			creadores
		].map(escapeCsvValue);
	});

	return [CSV_HEADERS.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

const formatHistory = (history) => toHistoryLines(history);


const CodigosFinalizadosMaestro = () => {
	const {
		items,
		loading,
		currentPage,
		setCurrentPage,
		totalPages,
		currentItems,
		clasesColor
	} = useTablaCodigos(
		'',
		'Finalizado',
		'/dashboard/maestro/editar',
		'bg-blue-300 text-black shadow-sm',
		{ endpoint: `${import.meta.env.VITE_BACKEND_URL}/api/maestro/codigos/finalizados` }
	);

	useEffect(() => {
		const link = document.createElement('link');
		link.href = PHONE_FONT_LINK;
		link.rel = 'stylesheet';
		document.head.appendChild(link);

		return () => {
			document.head.removeChild(link);
		};
	}, []);

	const handleExport = () => {
		if (items.length === 0) {
			toast.error('No hay datos para exportar');
			return;
		}

		try {
			downloadCsv(
				createCsvContent(items),
				`codigos_finalizados_${new Date().toISOString().split('T')[0]}.csv`
			);
			toast.success('Archivo generado exitosamente');
		} catch (error) {
			console.error('Error al exportar códigos:', error);
			toast.error('Error al generar el archivo');
		}
	};

	return (
		<div className="min-h-screen overflow-auto bg-white" style={{ fontFamily: 'Gowun Batang, serif' }}>
			<div className="w-full bg-blue-300 text-black shadow-sm">
				<div className="px-6 lg:px-8 py-4 lg:py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-4xl font-bold text-black">Códigos Finalizados</h1>
						<p className="mt-1 text-sm text-black/70">Registros concluidos por Maestro de Datos</p>
					</div>

					<button
						onClick={handleExport}
						disabled={items.length === 0}
						className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#17243D] shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
							<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
						</svg>
						Descargar CSV
					</button>
				</div>
			</div>

			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
					<div className="block md:hidden divide-y divide-slate-100">
						{loading ? (
							<div className="p-10 text-center text-slate-500 text-sm">Cargando registros...</div>
						) : currentItems.length === 0 ? (
							<div className="p-10 text-center text-slate-500 text-sm">No hay códigos finalizados.</div>
						) : (
							currentItems.map((item) => (
								<div key={item.id} className="border-b border-slate-100 last:border-none p-4 bg-white">
									<div className="flex items-center justify-between gap-3">
										<div>
											<span className="text-xs font-bold text-slate-400 block">#{item.id}</span>
											<span className="font-medium text-slate-800 text-sm line-clamp-1">{item.descripcion_sap || 'Sin descripción'}</span>
										</div>
										<span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{item.codigo || 'S/N'}</span>
									</div>
									<div className="mt-4 pt-4 border-t border-dashed border-slate-100 space-y-3 text-xs text-slate-700">
										<div>
											<span className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Status:</span>
											<span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-slate-700">{item.status}</span>
										</div>
										<div>
											<span className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Descripción SAP:</span>
											<p className="text-sm text-slate-700">{item.descripcion_sap || 'Sin datos'}</p>
										</div>
										<div>
											<span className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha:</span>
											<div className="space-y-1">
												{formatHistoryRows(item.r_sap_descomprimido).map((linea, index) => (
													<p key={`${item.id}-mobile-fecha-${index}`} className="text-slate-700 break-words">
														{linea.fecha || 'Sin fecha'}
													</p>
												))}
											</div>
										</div>
										<div>
											<span className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Creador:</span>
											<div className="space-y-1">
												{formatHistoryRows(item.r_sap_descomprimido).map((linea, index) => (
													<p key={`${item.id}-mobile-creador-${index}`} className="text-slate-700 break-words">
														{linea.creador || 'Sin creador'}
													</p>
												))}
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</div>

					<div className="hidden md:block w-full p-6 pb-0">
						<table className="w-full text-left border-separate border-spacing-y-4 layout-fixed">
							<thead>
								<tr className={`${clasesColor} border-b border-slate-200`}>
									<th className="rounded-tl-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[8%]">ID</th>
									<th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[15%]">SAP Code</th>
									<th className="p-5 text-center text-sm font-semibold uppercase tracking-[0.08em] w-[12%]">Status</th>
									<th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[25%]">Descripción SAP</th>
									<th className="p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[18%]">Fecha</th>
									<th className="rounded-tr-[24px] p-5 text-sm font-semibold uppercase tracking-[0.08em] w-[22%]">Creador</th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">Cargando registros...</td></tr>
								) : currentItems.length === 0 ? (
									<tr><td colSpan={6} className="p-10 text-center text-slate-500 text-sm">No hay códigos finalizados.</td></tr>
								) : (
									currentItems.map((item) => (
										<tr key={item.id} className="bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
											<td className="rounded-[20px] rounded-r-none p-5 font-bold text-slate-900">#{item.id}</td>
											<td className="p-5 text-center">
												<span className="px-2 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">{item.codigo || 'S/N'}</span>
											</td>
											<td className="p-5 text-center">
												<span className="text-sm font-medium capitalize bg-slate-100 px-3 py-1 rounded-full text-slate-700">{item.status}</span>
											</td>
											<td className="p-5 text-slate-700 font-medium truncate max-w-0" title={item.descripcion_sap || 'Sin datos'}>{item.descripcion_sap || 'Sin datos'}</td>
											<td className="p-5 text-slate-700 align-top">
												<div className="space-y-1">
													{formatHistoryRows(item.r_sap_descomprimido).map((linea, index) => (
														<p key={`${item.id}-desktop-fecha-${index}`} className="text-sm break-words">
															{linea.fecha || 'Sin fecha'}
														</p>
													))}
												</div>
											</td>
											<td className="rounded-[20px] rounded-l-none p-5 text-slate-700 align-top">
												<div className="space-y-1">
													{formatHistoryRows(item.r_sap_descomprimido).map((linea, index) => (
														<p key={`${item.id}-desktop-creador-${index}`} className="text-sm break-words">
															{linea.creador || 'Sin creador'}
														</p>
													))}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{!loading && currentItems.length > 0 && totalPages > 1 && (
					<div className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-[24px] mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
						<div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
							Mostrando <span className="font-semibold text-slate-900">{(currentPage - 1) * 5 + 1}</span> a{' '}
							<span className="font-semibold text-slate-900">{Math.min(currentPage * 5, currentItems.length)}</span> registros
						</div>

						<div className="flex flex-wrap justify-center gap-2 w-full sm:w-auto">
							<button
								onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
								disabled={currentPage === 1}
								className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
							>
								← Anterior
							</button>

							<div className="hidden sm:flex gap-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										onClick={() => setCurrentPage(page)}
										className={`px-3 py-2 rounded-lg transition-colors text-sm ${
											page === currentPage ? `${clasesColor} font-semibold` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										}`}
									>
										{page}
									</button>
								))}
							</div>

							<button
								onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
								disabled={currentPage === totalPages}
								className={`px-3 sm:px-4 py-2 ${clasesColor} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm flex-1 sm:flex-none text-center`}
							>
								Siguiente →
							</button>
						</div>
					</div>
				)}
			</div>

			<ToastContainer />
		</div>
	);
};

export default CodigosFinalizadosMaestro;
