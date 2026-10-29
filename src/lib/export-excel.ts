import {
  DEGREE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  type GraduateProfile,
  SALARY_RANGE_LABELS,
  formatDate,
} from "@/lib/graduates";

const CIAN = "FF0E7490";
const CIAN_CLARO = "FFECFEFF";

/** Genera y descarga un .xlsx con los egresados, sus experiencias y un resumen. */
export async function exportarEgresadosExcel(egresados: GraduateProfile[], filtros?: string): Promise<void> {
  // Carga diferida: exceljs pesa y solo se necesita al exportar.
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = "SISEBT";
  libro.created = new Date();
  const generado = new Date().toLocaleString("es-PE");
  // Primera hoja del libro; se rellena al final.
  const hojaResumen = libro.addWorksheet("Resumen");

  type Hoja = ReturnType<typeof libro.addWorksheet>;
  function encabezado(hoja: Hoja) {
    const fila = hoja.getRow(1);
    fila.font = { bold: true, color: { argb: "FFFFFFFF" } };
    fila.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CIAN } };
    fila.alignment = { vertical: "middle" };
    fila.height = 22;
    hoja.views = [{ state: "frozen", ySplit: 1 }];
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };
  }

  // ------------------------------------------------------------ Egresados
  const hojaEgresados = libro.addWorksheet("Egresados");
  hojaEgresados.columns = [
    { header: "Apellidos", key: "apellidos", width: 22 },
    { header: "Nombres", key: "nombres", width: 20 },
    { header: "DNI", key: "dni", width: 11 },
    { header: "Correo", key: "correo", width: 30 },
    { header: "Teléfono", key: "telefono", width: 14 },
    { header: "Ciudad", key: "ciudad", width: 14 },
    { header: "Código", key: "codigo", width: 14 },
    { header: "Programa", key: "programa", width: 28 },
    { header: "Año de ingreso", key: "ingreso", width: 14 },
    { header: "Fecha de egreso", key: "egreso", width: 15 },
    { header: "Promoción", key: "promocion", width: 11 },
    { header: "Grado", key: "grado", width: 11 },
    { header: "Estado laboral", key: "estado", width: 15 },
    { header: "Inserción (meses)", key: "insercion", width: 16 },
    { header: "Empresa actual", key: "empresa", width: 26 },
    { header: "Cargo actual", key: "cargo", width: 24 },
    { header: "Sector", key: "sector", width: 18 },
    { header: "Rango salarial", key: "salario", width: 18 },
    { header: "N.° experiencias", key: "experiencias", width: 15 },
  ];
  for (const g of egresados) {
    const actual = g.experiences.find((e) => e.isCurrent);
    hojaEgresados.addRow({
      apellidos: g.lastName,
      nombres: g.firstName,
      dni: g.dni,
      correo: g.email,
      telefono: g.phone ?? "",
      ciudad: g.city ?? "",
      codigo: g.studentCode,
      programa: g.program,
      ingreso: g.admissionYear,
      egreso: formatDate(g.graduationDate),
      promocion: Number(g.graduationDate.slice(0, 4)),
      grado: DEGREE_LABELS[g.degree],
      estado: EMPLOYMENT_STATUS_LABELS[g.employmentStatus],
      insercion: g.insertionMonths ?? "",
      empresa: actual?.company ?? "",
      cargo: actual?.position ?? "",
      sector: actual?.sector ?? "",
      salario: actual?.salaryRange ? SALARY_RANGE_LABELS[actual.salaryRange] : "",
      experiencias: g.experiences.length,
    });
  }
  encabezado(hojaEgresados);

  // --------------------------------------------------------- Experiencias
  const hojaExp = libro.addWorksheet("Experiencias");
  hojaExp.columns = [
    { header: "Egresado", key: "egresado", width: 30 },
    { header: "DNI", key: "dni", width: 11 },
    { header: "Empresa", key: "empresa", width: 28 },
    { header: "Cargo", key: "cargo", width: 26 },
    { header: "Sector", key: "sector", width: 18 },
    { header: "Rango salarial", key: "salario", width: 18 },
    { header: "Inicio", key: "inicio", width: 12 },
    { header: "Fin", key: "fin", width: 12 },
    { header: "Actual", key: "actual", width: 9 },
    { header: "Primer empleo", key: "primero", width: 14 },
    { header: "Independiente", key: "independiente", width: 14 },
  ];
  for (const g of egresados) {
    for (const e of g.experiences) {
      hojaExp.addRow({
        egresado: `${g.lastName}, ${g.firstName}`,
        dni: g.dni,
        empresa: e.company,
        cargo: e.position,
        sector: e.sector,
        salario: e.salaryRange ? SALARY_RANGE_LABELS[e.salaryRange] : "",
        inicio: formatDate(e.startDate),
        fin: e.isCurrent ? "Actualidad" : formatDate(e.endDate),
        actual: e.isCurrent ? "Sí" : "No",
        primero: e.isFirstJob ? "Sí" : "No",
        independiente: e.isSelfEmployed ? "Sí" : "No",
      });
    }
  }
  encabezado(hojaExp);

  // -------------------------------------------------------------- Resumen
  const total = egresados.length;
  const porEstado = (estado: GraduateProfile["employmentStatus"]) =>
    egresados.filter((g) => g.employmentStatus === estado).length;
  const meses = egresados.map((g) => g.insertionMonths).filter((m): m is number => m !== null);
  const conEmpleo = porEstado("EMPLOYED") + porEstado("INDEPENDENT");

  hojaResumen.columns = [{ width: 34 }, { width: 22 }];
  hojaResumen.addRow(["SISEBT · Reporte de egresados"]).font = { bold: true, size: 14, color: { argb: CIAN } };
  hojaResumen.addRow([`Generado el ${generado}`]).font = { italic: true, color: { argb: "FF64748B" } };
  if (filtros) hojaResumen.addRow([`Filtros: ${filtros}`]).font = { color: { argb: "FF64748B" } };
  hojaResumen.addRow([]);
  const filas: [string, string | number][] = [
    ["Egresados registrados", total],
    ["Empleados", porEstado("EMPLOYED")],
    ["Independientes", porEstado("INDEPENDENT")],
    ["Desempleados", porEstado("UNEMPLOYED")],
    ["Tasa de empleabilidad", total ? `${Math.round((conEmpleo / total) * 100)}%` : "—"],
    ["Inserción laboral promedio (meses)", meses.length ? Number((meses.reduce((a, b) => a + b, 0) / meses.length).toFixed(1)) : "—"],
  ];
  for (const [etiqueta, valor] of filas) {
    const fila = hojaResumen.addRow([etiqueta, valor]);
    fila.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CIAN_CLARO } };
    fila.getCell(1).font = { bold: true };
    fila.getCell(2).alignment = { horizontal: "right" };
  }

  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `egresados-sisebt-${new Date().toISOString().slice(0, 10)}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
