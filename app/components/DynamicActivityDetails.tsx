"use client";
import { useEffect, useState, useCallback } from "react";
import { SquareCheck, Pencil } from "lucide-react";

const API_BASE_URL = "https://meseer.com/dog";

type ActivityItem = {
  a_id: number;
  at_id: number;
  name: string;
  flag: string;
  trigger: string;
};

type MWBEntry = {
  ua_id: number;
  a_id: number;
  at_id: number;
  flag: string;
  trigger: string;
  user_id: string;
  description: string;
  cat_qty_id1?: any;
  cat_qty_id2?: any;
  cat_qty_id3?: any;
  cat_qty_id4?: any;
  cat_qty_id5?: any;
  cat_qty_id6?: any;
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  value5: string;
  value6: string;
  event_time?: string;
};

type Props = {
  userId: string;
  collectiveId: number;
  activityItems: ActivityItem[];
};

export default function DynamicActivityDetails({ userId, collectiveId, activityItems }: Props) {
  const [dataMap, setDataMap] = useState<Record<number, MWBEntry[]>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [templateMap, setTemplateMap] = useState<Record<number, any>>({});

  const fetchAll = useCallback(async () => {
    if (!userId || !collectiveId || !activityItems?.length) return;

    setLoading(true);
    try {
      const requests = activityItems.map(item =>
        Promise.all([
          fetch(`${API_BASE_URL}/generic/get-it/${userId}/${item.a_id}/${collectiveId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }).then(res => res.json()),
          fetch(`${API_BASE_URL}/generic/templates/${item.a_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }).then(res => res.json())
        ])
      );

      const results = await Promise.all(requests);

      const newDataMap: Record<number, MWBEntry[]> = {};
      const newTemplateMap: Record<number, any> = {};

      results.forEach(([data, template], index) => {
        const item = activityItems[index];

        // Normalize data: array stays as-is, object gets converted to array of values
        const normalizedData = Array.isArray(data)
          ? data
          : typeof data === "object" && data !== null
            ? Object.values(data)
            : [];

        newDataMap[item.a_id] = normalizedData;
        newTemplateMap[item.a_id] = template;
      });

      setDataMap(newDataMap);
      setTemplateMap(newTemplateMap);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  }, [userId, collectiveId, activityItems]);


  const updatePrimaryMWBData = async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/update-delete-data/primary-mwb`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    return await response.json();
  };

  const handleUpdateItem = async (item: MWBEntry) => {
    try {
      const payload: any = {
        ua_id: item.ua_id,
        a_id: item.a_id,
        at_id: item.at_id,
        flag: item.flag,
        trigger: item.trigger,
        is_active: true,
        user_id: userId,
        description: editedValues.value2 || item.description,
        action: "UPDATE",
        cat_qty_id1: item.cat_qty_id1 ?? "None",
        cat_qty_id2: item.cat_qty_id2 ?? "None",
        cat_qty_id3: item.cat_qty_id3 ?? "None",
        cat_qty_id4: item.cat_qty_id4 ?? "None",
        cat_qty_id5: item.cat_qty_id5 ?? "None",
        cat_qty_id6: item.cat_qty_id6 ?? "None",
        value1: editedValues.value1 ?? item.value1,
        value2: editedValues.value2 ?? item.value2,
        value3: editedValues.value3 ?? item.value3,
        value4: editedValues.value4 ?? item.value4,
        value5: editedValues.value5 ?? item.value5,
        value6: editedValues.value6 ?? item.value6,
      };
      await updatePrimaryMWBData(payload);
      setEditingItemId(null);
      await fetchAll();
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  const getFieldOptions = (fieldData: any) => {
    if (!fieldData || !Array.isArray(fieldData)) return [];

    // The first item is usually metadata, skip it
    const isFirstItemMetadata = fieldData[0]?.item_id !== undefined;
    return isFirstItemMetadata ? fieldData.slice(1) : fieldData;
  };

  const getSelectedOptionName = (fieldData: any) => {
    if (!fieldData || !Array.isArray(fieldData)) return null;

    // Find item with flag: "selected" or Selected: true
    const selectedItem = fieldData.find(item => item.flag === "selected" || item.Selected);
    return selectedItem?.name || null;

  };
  const getSelectedOption = (fieldData: any) => {
    if (!fieldData || !Array.isArray(fieldData)) return null;

    // Find item with flag: "selected" or Selected: true
    return fieldData.find(item => item.flag === "selected" || item.Selected)?.name ||
      fieldData[0]?.name; // Fallback to first option
  };

  const getDefaultValue = (fieldData: any) => {
    const selected = getSelectedOption(fieldData);
    return selected || '';
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <div className="text-sm text-gray-400">Loading activity details...</div>;

  return (
    <div className="space-y-6">
      {activityItems.map((item) => {
        const itemData = dataMap[item.a_id] || [];

        return (
          <div key={`activity-${item.a_id}`}>
            <h3 className="text-md font-semibold text-gray-700 mb-2">{item.name}</h3>
            <div className="space-y-2">
              {itemData.map((entry) => {
                const isEditing = editingItemId === entry.ua_id;

                const renderFields = [1, 2, 3, 4, 5, 6].flatMap((i) => {
                  const valueKey = `value${i}` as keyof MWBEntry;
                  const catQtyKey = `cat_qty_id${i}` as keyof MWBEntry;
                  const value = entry[valueKey];
                  const fieldData = entry[catQtyKey];
                  const options = getFieldOptions(fieldData);
                  const selectedOption = getSelectedOptionName(fieldData);

                  if (!isEditing && !value && !selectedOption) return null;

                  const fieldName = (
                    templateMap[item.a_id]?.[`item_id${i}`]?.[0]?.item_description ||
                    templateMap[item.a_id]?.[`item_id${i}`]?.[0]?.item_name ||
                    `Field ${i}`
                  )
                    .replace(/^add\s+/i, "")
                    .replace(/\bbased on.*$/i, "")
                    .trim();

                  return (
                    <div key={`field-${entry.ua_id}-${i}`} className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">{fieldName}</label>
                        {isEditing ? (
                          options.length > 0 ? (
                            <select
                              value={editedValues[`value${i}`] ?? String(value ?? "")}
                              onChange={(e) =>
                                setEditedValues((prev) => ({ ...prev, [`value${i}`]: e.target.value }))
                              }
                              className="border border-blue-400 rounded px-2 py-1 text-sm"
                            >
                              {options.map((opt: any) => (
                                <option
                                  key={`option-${opt.cat_id || opt.unit_id || opt.name}`}
                                  value={opt.name}
                                >
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={editedValues[`value${i}`] ?? String(value ?? "")}
                              onChange={(e) =>
                                setEditedValues((prev) => ({ ...prev, [`value${i}`]: e.target.value }))
                              }
                              className="border border-blue-400 rounded px-2 py-1 text-sm"
                            />
                          )
                        ) : (
                          <input
                            value={String(value ?? "")}
                            readOnly
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        )}
                      </div>

                      {selectedOption && (
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 mb-1">Option</label>
                          <input
                            value={selectedOption}
                            readOnly
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  );
                }).filter(Boolean); // Remove any null entries from flatMap

                return (
                  <div
                    key={`entry-${entry.ua_id}`}
                    className="grid gap-2 items-start text-sm border rounded p-3 bg-white shadow-sm"
                  >
                    {renderFields.length > 0 ? renderFields : (
                      <div className="text-gray-500 text-sm">No data available</div>
                    )}

                    <div className="flex justify-end gap-2 mt-1">
                      {isEditing ? (
                        <button
                          className="text-green-600 hover:text-green-800 text-sm"
                          title="Save"
                          onClick={() => handleUpdateItem(entry)}
                        >
                          <SquareCheck className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          className="text-gray-500 hover:text-black text-sm"
                          title="Edit"
                          onClick={() => {
                            setEditingItemId(entry.ua_id);
                            const ev: Record<string, string> = {};
                            for (let i = 1; i <= 6; i++) {
                              ev[`value${i}`] = String(entry[`value${i}` as keyof MWBEntry] ?? "");
                            }
                            setEditedValues(ev);
                          }}
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}