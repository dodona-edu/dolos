import * as d3 from "d3";
import { MetaRowType } from "@/api/models";

export function castToType(row: d3.DSVRowString): MetaRowType {
  const rowValue = row.value;
  const rowType = row.type;
  const newRow = row as MetaRowType;
  if (rowType === "boolean") {
    newRow.value = rowValue ? rowValue.toLowerCase() === "true" : false;
  } else if (rowValue && rowType === "number") {
    newRow.value = Number.parseFloat(rowValue);
  } else if (rowType === "object") {
    newRow.value = rowValue;
  }
  return newRow;
}
