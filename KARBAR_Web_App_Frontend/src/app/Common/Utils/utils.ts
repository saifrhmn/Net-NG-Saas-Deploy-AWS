import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

//patterns
export const requiredPattern = '[a-zA-Z0-9. /:-]{3,}';
export const datePattern = '[0-9]{4}-[0-9]{2}-[0-9]{2}.*';
export const http = '(http[s]?://[^ ]*)';
export const mobilePattern = '^01[0-9]{9}';
export const emailPattern = '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$';
export const passPattern = '^(?=.*[a-zA-Z0-9])[A-Za-z0-9!@$!%*?&]{6,}$';

export const vehicleNumberPattern = '[0-9]{2}-[0-9]{4}';

export const usernamePattern =
  '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+|^0[0-9]{10}';
export const idPattern = '^[a-zA-Z0-9.-]+$';
export const postPattern = '[0-9]{4,}';
export const numberIdPattern = '[0-9]{1,}';
export const numberPattern = '[0-9]{1,}.*[0-9]{0,}';

export const AppLog = (args: any) => {
  console.log(args);
}

export const SAVED_ORDERS = 'SavedOrders';




export const comparePartner = (o1: { userId: any; }, o2: { userId: any; }) => {
  return o1 && o2 ? o1.userId === o2.userId : o1 === o2;
}

export const compareCustomer = (o1: { customerId: any; }, o2: { customerId: any; }) => {
  return o1 && o2 ? o1.customerId === o2.customerId : o1 === o2;
}
export const compareDate = (pDate: string): boolean => {
  let pd = new Date(Date.parse(pDate));
  var planDate = pd.getFullYear() + "-" + (pd.getMonth() + 1) + "-" + pd.getDate() + " " + 0 + ":" + 0 + ":" + 0;
  var d = new Date();
  var currentDate = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + 0 + ":" + 0 + ":" + 0;
  var planDateInMileSeconds = Date.parse(planDate);
  var currentDateInMileScondes = Date.parse(currentDate);
  if (planDateInMileSeconds >= currentDateInMileScondes + 259200000) return true;
  else return false
}

export const convertISOtoMMDDYYYY = (value: string) => {
  let date = new Date(value);
  let year = date.getFullYear();
  let month: any = date.getMonth() + 1;
  let dt: any = date.getDate();
  if (dt < 10) {
    dt = '0' + dt;
  }
  if (month < 10) {
    month = '0' + month;
  }
  return month + '/' + dt + '/' + year;
  //return new Date(date).toLocaleDateString();
}
// export const exportToExcel = (
//   input: string | any[],
//   fileName: string = 'report',
//   opts?: {
//     sheetName?: string;
//     appendDate?: boolean; // default: true → appends YYYY-MM-DD
//     autoWidth?: boolean;  // default: true → sets column widths by content length
//     headers?: string[];   // optional explicit header order for object arrays
//   }
// ) => {
//   const sheetName = opts?.sheetName || 'Sheet1';
//   const appendDate = opts?.appendDate !== false; // default true
//   const autoWidth = opts?.autoWidth !== false;   // default true

//   let worksheet: XLSX.WorkSheet;

//   if (typeof input === 'string') {
//     // Case 1: input is table element ID
//     const table = document.getElementById(input);
//     if (!table) {
//       console.error('exportToExcel: Table not found by ID:', input);
//       return;
//     }
//     worksheet = XLSX.utils.table_to_sheet(table);
//   } else if (Array.isArray(input)) {
//     // Case 2: input is array of objects
//     const rows = input || [];
//     let headers = opts?.headers;

//     if (!headers || headers.length === 0) {
//       // Build a stable header list from union of keys
//       const keySet = new Set<string>();
//       rows.forEach(r => Object.keys(r || {}).forEach(k => keySet.add(k)));
//       headers = Array.from(keySet);
//     }

//     // Ensure objects align to header order
//     const normalized = rows.map((r: any) => {
//       const o: any = {};
//       headers!.forEach(h => o[h] = r?.[h] ?? '');
//       return o;
//     });

//     worksheet = XLSX.utils.json_to_sheet(normalized, { header: headers });
//   } else {
//     console.error('exportToExcel: Invalid input. Provide table ID or array of objects.');
//     return;
//   }

//   // Optional: set column widths based on content length
//   if (autoWidth && worksheet) {
//     const colWidths: number[] = [];
//     const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
//     for (let C = range.s.c; C <= range.e.c; ++C) {
//       let maxLen = 10; // minimum width
//       for (let R = range.s.r; R <= range.e.r; ++R) {
//         const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
//         const cell = worksheet[cellAddress];
//         const v = cell ? String(cell.v ?? '') : '';
//         if (v.length > maxLen) maxLen = v.length;
//       }
//       colWidths.push({ wch: Math.min(Math.max(maxLen + 2, 10), 60) } as any);
//     }
//     (worksheet as any)['!cols'] = colWidths as any;
//   }

//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, worksheet, sheetName);

//   const safeBase = (fileName || 'report').trim() || 'report';
//   const stamp = appendDate ? `_${new Date().toISOString().slice(0, 10)}` : '';
//   const finalName = `${safeBase}${stamp}.xlsx`;

//   XLSX.writeFile(wb, finalName);
// };


export const exportToExcel = (data: any[], filename: string = 'export.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
  XLSX.writeFile(workbook, filename);
}
export const groupByKey = (identifier: string, data: any[]) => {

  let reduecd = data.reduceRight(
    (result: any, currentValue: any) => {

      result[currentValue[identifier]] = result[currentValue[identifier]] || {
        name: currentValue.groupName,
        groupId: currentValue.groupGenId,
        groupSerial: currentValue.groupSerial,
        sideMenus: [],
        permissions: [],
        children: []
      };

      if (currentValue.isSideMenu) {
        result[currentValue[identifier]].sideMenus.push(currentValue);
      }
      else {
        result[currentValue[identifier]].permissions.push(currentValue);
      }
      result[currentValue[identifier]].children.push(currentValue);
      return result;
    }, {});



  let list = Object.keys(reduecd).map(key => {
    return reduecd[key];
  });
  list.map((item: any) => {
    item.children.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });
    item.sideMenus.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });
    item.permissions.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });

  });
  list.sort((a: any, b: any) => {
    if (a.groupSerial < b.groupSerial) {
      return -1;
    }
    if (a.groupSerial > b.groupSerial) {
      return 1;
    }
    return 0;
  })
  return list;

}
export const businessByKey = (identifier: string, data: any[]) => {

  let reduecd = data.reduceRight(
    (result: any, currentValue: any) => {
      result[currentValue[identifier]] = result[currentValue[identifier]] || {
        name: currentValue.businessName,
        businessType: currentValue.businessType,
        sideMenus: [],
        permissions: [],
        children: []
      };

      if (currentValue.isSideMenu) {
        result[currentValue[identifier]].sideMenus.push(currentValue);
      }
      else {
        result[currentValue[identifier]].permissions.push(currentValue);
      }
      result[currentValue[identifier]].children.push(currentValue);
      return result;
    }, {});



  let list = Object.keys(reduecd).map(key => {
    return reduecd[key];
  });
  list.map((item: any) => {
    item.children.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });
    item.sideMenus.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });
    item.permissions.sort((a: any, b: any) => {
      if (a.serial < b.serial) {
        return -1;
      }
      if (a.serial > b.serial) {
        return 1;
      }
      return 0;
    });

  });
  return list;

}



const compareSerial = (a: { serial: number; }, b: { serial: number; }) => {
  if (a.serial < b.serial) {
    return 1;
  }
  if (a.serial > b.serial) {
    return -1;
  }
  return 0;
}



export const generatePDF = (table: any) => {
  let doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'a1' });
  autoTable(doc, {
    // body: [
    //   [{ content: 'Text', colSpan: 2, rowSpan: 2, styles: { halign: 'center' } }],
    // ],
    useCss: true,
    html: '#' + table,
    tableWidth: 'auto',
    showHead: 'everyPage',
    startY: 2,
    //horizontalPageBreak : true,
    theme: 'striped',
    //tableId: table,

  });
  doc.save('table.pdf')
}


// export const downloadExcel = (tableId: string) => {
//   // Find the table element using its ID
//   const table = document.getElementById(tableId);
//   if (!table) {
//     console.error('Table not found!');
//     return;
//   }

//   // Convert the HTML table to a worksheet
//   const worksheet = XLSX.utils.table_to_sheet(table);

//   // Create a new workbook and append the worksheet
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

//   // Generate an Excel file and trigger the download
//   XLSX.writeFile(workbook, 'table.xlsx');
// };

export const downloadExcel = (tableId: string, file: string) => {
  // Find the table element using its ID
  const table = document.getElementById(tableId);
  if (!table) {
    console.error('Table not found!');
    return;
  }

  // Convert the HTML table to a worksheet
  const worksheet = XLSX.utils.table_to_sheet(table);

  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Generate an Excel file and trigger the download
  // XLSX.writeFile(workbook, 'table.xlsx');
  const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  // const fileName = `report_${date}.xlsx`; // Create dynamic file name
  const safeFileName = file.trim() || "report"; // Default to 'report' if file is empty
  const fileName = `${safeFileName}_${date}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};


export const base64imagePrefix = 'data:image/png;base64,';
export const convertBs64toImage = (bs64: string) => {
  return `${base64imagePrefix}${bs64}`;
}



export const GEO_CYCLE_FILE = "https://drive.google.com/file/d/1WnOAQzV2BJxp-BIaJd7bGyKIyTGUcgx5/view?usp=drive_link";
export const POSTAL_CODE_FILE = "https://drive.google.com/file/d/1sosXcPZ7g4oV2VXR-axsPAHztKv3HvOx/view?usp=drive_link";
export const FACOTORY_CODE_FILE = "https://drive.google.com/file/d/1ADFs1HhHxAxk3KMBzyj_N_XisboIhNct/view?usp=drive_link";




export function atLeastOne(validator: ValidatorFn, controls: string[] = []): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control) return null;
    const formGroup = control as FormGroup;
    return (formGroup && controls.some(k => !validator(formGroup.controls[k]))) ? null : {
      atLeastOne: true,
    };
  }
}
