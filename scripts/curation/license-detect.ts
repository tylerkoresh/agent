/** Best-effort license identification from LICENSE file text. Not legal advice; "unrecognized" is a valid answer. */
export function detectLicense(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  const has = (re: RegExp) => re.test(t);
  if (has(/GNU AFFERO GENERAL PUBLIC LICENSE/i)) return "AGPL-3.0";
  if (has(/GNU LESSER GENERAL PUBLIC LICENSE/i)) return has(/Version 2\.1/i) ? "LGPL-2.1" : "LGPL-3.0";
  if (has(/GNU GENERAL PUBLIC LICENSE/i)) return has(/Version 2,? June 1991/i) ? "GPL-2.0" : "GPL-3.0";
  if (has(/Apache License,? Version 2\.0/i)) return "Apache-2.0";
  if (has(/Mozilla Public License,? (Version |v\.? ?)2\.0/i)) return "MPL-2.0";
  if (has(/CC0 1\.0 Universal/i)) return "CC0-1.0";
  if (has(/Commons Clause/i)) return "Commons-Clause (not open source; read the file)";
  if (has(/Creative Commons/i)) {
    const m = t.match(/Attribution(?:-NonCommercial)?(?:-ShareAlike|-NoDerivatives)?(?: 4\.0)?/i);
    return `CC (${m ? m[0] : "variant unclear"})`;
  }
  if (has(/This is free and unencumbered software released into the public domain/i)) return "Unlicense";
  if (has(/Permission is hereby granted, free of charge/i)) return "MIT";
  if (has(/ISC License/i) || has(/Permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee/i)) return "ISC";
  if (has(/Redistribution and use in source and binary forms/i)) return has(/Neither the name/i) ? "BSD-3-Clause" : "BSD-2-Clause";
  if (has(/MIT License/i)) return "MIT";
  if (has(/all rights reserved/i) && has(/(proprietary|may not|not permitted|prohibited|except as expressly)/i)) return "proprietary/restrictive (read the file)";
  return "unrecognized";
}
