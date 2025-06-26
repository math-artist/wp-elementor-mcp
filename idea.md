Improve the data:
interface ParsedElementorData {
  success: boolean;
  data?: any[];
  rawData?: string;
  error?: string;
  debugInfo?: string;
}
by adding a flattened dictionary by id, so that when ParsedElementorData.data 
is generated, it also generate a dict where we can easily find any element by id
the dict values would be dict and have some additional meta like this:
{
    type: string;
    id: string;
    parent_id: string;
    data: any[];
    path: list;
}
where path is an ordered list of parent ids or positions that allows you to find the element 
directly from ParsedElementorData.data


Page translator:
- verify if Polylang is installed.
- get a flattened dict of all visible text on the page, with meta like above.
- we would have 3 MCP tools:
- get_page_text, would return a dict with the text in the page language
- create_translated_page_from_text, would receive the translated dict of text and 
the id of the original page. It would duplicate the page, update the page language 
(Polylang setting), then replace the text with 
the translated text based on the dict meta information (id, or fallback to path, or fallback to text search).
- update_translated_page_from_text: similar to above, except the page already exist and 
language is already set, so it just update the text by default.  But, optional full_update bool 
that will delete the layout and replace with the original page layout 
(when the change is not just text, but an added section, for example.)
- The AI agent running the MCP tool is instructed to translate the text and 
update with the appropriate tool.