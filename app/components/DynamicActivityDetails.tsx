"use client";
import { useEffect, useState } from "react";
import { SquareCheck, Pencil } from "lucide-react";

const API_BASE_URL = "https://meseer.com/dog";

type ActivityItem = {
  a_id: number;
  at_id: number;
  name: string;
  flag: string;
  trigger: string;
};

type UnitOption = {
  unit_id?: number;
  cat_id?: number;
  name: string;
  Selected?: boolean;
  flag?: string;
  item_type?: string;
};

type MWBEntry = {
  ua_id: number;
  a_id: number;
  at_id: number;
  flag: string;
  trigger: string;
  user_id: string;
  description: string;
  cat_qty_id1?: number | "None";
  cat_qty_id2?: number | "None";
  cat_qty_id3?: UnitOption[];
  cat_qty_id4?: number | "None";
  cat_qty_id5?: number | "None";
  cat_qty_id6?: number | "None";
  value1: string;
  value2: string;
  value3: string | number;
  value4: string;
  value5: string;
  value6: string;
};

type Props = {
  userId: string;
  collectiveId: number;
  activityItems: ActivityItem[];
  realCollectiveId?: number; 
};

export default function DynamicActivityDetails({ userId, realCollectiveId,collectiveId, activityItems }: Props) {
  const [dataMap, setDataMap] = useState<Record<number, MWBEntry[]>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [templateMap, setTemplateMap] = useState<Record<number, any>>({});

  const fetchAll = async () => {
    setLoading(true);
    const result: Record<number, MWBEntry[]> = {};

    for (const item of activityItems) {
      if (item.a_id === 26) {
        item.a_id = 24;
      }
      if ((item.a_id === 24 ||item.a_id === 25)&&realCollectiveId) {
        return;
      }
      try {
        const correctCollectiveId = (item.a_id === 29 || item.a_id === 33) ? realCollectiveId : collectiveId;
        const res = await fetch(`${API_BASE_URL}/generic/get-it/${userId}/${item.a_id}/${correctCollectiveId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const json = await res.json();

        const entriesArray = json ? Object.values(json) : [];
        result[item.a_id] = entriesArray as MWBEntry[];

        const templateRes = await fetch(`${API_BASE_URL}/generic/templates/${item.a_id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const templateJson = await templateRes.json();
        setTemplateMap((prev) => ({ ...prev, [item.a_id]: templateJson }));
      } catch (err) {
        console.error(`Error fetching data for pa_id ${item.a_id}`, err);
        result[item.a_id] = [];
      }
    }

    setDataMap(result);
    setLoading(false);
  };

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
      const getCollectiveId = (list: unknown): number | undefined => {
        return Array.isArray(list) ? list[0]?.collective_id : undefined;
      };

      const getCatId = (list: unknown, i: number): number | undefined => {
        if (!Array.isArray(list)) return undefined;
        return editedValues[`unit${i}`]
          ? Number(editedValues[`unit${i}`])
          : list.find((u: any) => u?.flag === "selected")?.cat_id;
      };

      const getUnitId = (list: unknown, i: number): number | undefined => {
        if (!Array.isArray(list)) return undefined;
        return editedValues[`unit${i}`]
          ? Number(editedValues[`unit${i}`])
          : list.find((u: any) => u?.flag === "selected" || u?.Selected)?.unit_id;
      };

      let payload: any = {
        ua_id: item.ua_id,
        a_id: item.a_id,
        at_id: item.at_id,
        flag: item.flag,
        trigger: item.trigger,
        is_active: true,
        user_id: userId,
        description: editedValues.value2 || item.description || "",
        action: "UPDATE",
      };

      if (item.a_id === 10) {
        payload = {
          ...payload,
          trigger: item.trigger ?? "meal",
          cat_qty_id1: getCollectiveId(item.cat_qty_id1),
          cat_qty_id2: getCatId(item.cat_qty_id2, 2),
          cat_qty_id3: getCatId(item.cat_qty_id3, 3),
          cat_qty_id4: getUnitId(item.cat_qty_id4, 4),
          cat_qty_id5: getCatId(item.cat_qty_id5, 5),
          cat_qty_id6: getCatId(item.cat_qty_id6, 6),
          value1: editedValues.value1 ?? item.value1 ?? "",
          value2: editedValues.value2 ?? item.value2 ?? "",
          value3: editedValues.value3 ?? item.value3 ?? "",
          value4: editedValues.value4 ?? item.value4 ?? "",
          value5: editedValues.value5 ?? item.value5 ?? "",
          value6: editedValues.value6 ?? item.value6 ?? "",
        };
      } else {
        payload = {
          ...payload,
          cat_qty_id1: item.cat_qty_id1 ?? null,
          cat_qty_id2: item.cat_qty_id2 ?? null,
          cat_qty_id3:
            item.a_id === 9
              ? Number(editedValues.unit3) || item.cat_qty_id3?.find((u) => u?.Selected)?.unit_id || null
              : item.cat_qty_id3?.find((u) => u?.Selected)?.unit_id ?? null,
          cat_qty_id4: Array.isArray(item.cat_qty_id4)
            ? item.cat_qty_id4.find((u: any) => u?.Selected || u?.flag === "selected")?.unit_id ?? null
            : item.cat_qty_id4 ?? null,
          cat_qty_id5: Array.isArray(item.cat_qty_id5)
            ? item.cat_qty_id5.find((u: any) => u?.Selected || u?.flag === "selected")?.unit_id ?? null
            : item.cat_qty_id5 ?? null,
          cat_qty_id6: Array.isArray(item.cat_qty_id6)
            ? item.cat_qty_id6.find((u: any) => u?.Selected || u?.flag === "selected")?.unit_id ?? null
            : item.cat_qty_id6 ?? null,
          value1: editedValues.value1 ?? item.value1 ?? "",
          value2: editedValues.value2 ?? item.value2 ?? "",
          value3: editedValues.value3 ?? item.value3 ?? "",
          value4: editedValues.value4 ?? item.value4 ?? "",
          value5: editedValues.value5 ?? item.value5 ?? "",
          value6: editedValues.value6 ?? item.value6 ?? "",
        };
      }

      await updatePrimaryMWBData(payload);
      setEditingItemId(null);
      await fetchAll();
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  useEffect(() => {
    if (!userId || !collectiveId || !activityItems?.length) return;
    fetchAll();
  }, [userId, collectiveId, activityItems]);

  if (loading) return <div className="text-sm text-gray-400 p-4">Loading activity details...</div>;

  return (
    <div className="space-y-6 p-4">
      {activityItems.map((item) => {
        const itemData = Array.isArray(dataMap[item.a_id]) ? dataMap[item.a_id] : [];
        if (itemData.length === 0) return null;
        // Check if any entry inside itemData has at least one non-empty value
        const hasValidEntry = itemData.some((entry) => {
          for (let i = 1; i <= 6; i++) {
            const val = entry[`value${i}` as keyof MWBEntry];
            const unitList = entry[`cat_qty_id${i}` as keyof MWBEntry];
            const selectedUnit = Array.isArray(unitList)
              ? unitList.find((u: any) => u?.Selected || u?.flag === "selected")
              : null;
            if ((val !== "" && val !== undefined && val !== null) || selectedUnit) {
              return true;
            }
          }
          return false;
        });

        // If all entries are empty, skip rendering this whole activity section
        if (!hasValidEntry) return null;

        return (
          <div key={item.a_id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <h3 className="text-md font-semibold text-gray-800 p-4 border-b border-gray-100">
              {item.name}
            </h3>
            <div className="space-y-3 p-4">
              {itemData.map((entry) => {
                const isEditing = editingItemId === entry.ua_id;
                const indices = entry.a_id === 13 ? [1, 2, 3, 4, 6] : [1, 2, 3, 4, 5, 6];

                const renderFields = indices.flatMap((i) => {
                  const value = entry[`value${i}` as keyof MWBEntry];
                  const unitList = entry[`cat_qty_id${i}` as keyof MWBEntry];
                  const aId = entry.a_id;
                  const isAid10 = aId === 10;

                  if (isAid10 && [2, 3, 5, 6].includes(i)) {
                    const options = Array.isArray(unitList) ? unitList : [];
                    const selectedOption = options.find((u: any) => u?.Selected || u?.flag === "selected");

                    const labelMap: Record<number, string> = {
                      2: "Day of the Week",
                      3: "Meal Type",
                      5: "Person(s) with whom food was consumed",
                      6: "Activity done while eating food",
                    };

                    return (
                      <div key={`val${i}`} className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">{labelMap[i]}</label>
                        {isEditing ? (
                          <select
                            value={editedValues[`unit${i}`] ?? String(selectedOption?.cat_id || "")}
                            onChange={(e) =>
                              setEditedValues((prev) => ({ ...prev, [`unit${i}`]: e.target.value }))
                            }
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            {options
                              .filter((opt) => opt?.cat_id)
                              .map((opt, idx) => (
                                <option key={idx} value={opt.cat_id}>
                                  {opt.name}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            value={selectedOption?.name || ""}
                            readOnly
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                          />
                        )}
                      </div>
                    );
                  }

                  const options = Array.isArray(unitList) ? unitList : [];
                  const selectedUnit = options.find((u: any) => u?.Selected || u?.flag === "selected");
                  const isUnitField = !!selectedUnit?.unit_id || i === 4;
                  const displayValue =
                    value && value !== "None"
                      ? value
                      : selectedUnit?.name || "";

                  const unitValue = selectedUnit?.name;

                  if (!displayValue && !unitValue) return [];

                  return (
                    <div key={`val${i}`} className={`grid ${unitValue ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">
                          {(templateMap[aId]?.[`item_id${i}`]?.[0]?.item_description ||
                            templateMap[aId]?.[`item_id${i}`]?.[0]?.item_name ||
                            `Field ${i}`)
                            .replace(/^add\s+/i, "")
                            .replace(/\bbased on.*$/i, "")
                            .trim()}
                        </label>
                        {isEditing ? (
                          <input
                            value={editedValues[`value${i}`] ?? String(displayValue ?? "")}
                            onChange={(e) =>
                              setEditedValues((prev) => ({ ...prev, [`value${i}`]: e.target.value }))
                            }
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <input
                            value={String(displayValue ?? "")}
                            readOnly
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                          />
                        )}
                      </div>

                      {unitValue && selectedUnit?.unit_id && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500">Unit</label>
                          {isEditing ? (
                            <select
                              value={editedValues[`unit${i}`] ?? String(selectedUnit?.unit_id || selectedUnit?.cat_id || "")}
                              onChange={(e) =>
                                setEditedValues((prev) => ({ ...prev, [`unit${i}`]: e.target.value }))
                              }
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Unit</option>
                              {options
                                .filter((opt) => opt?.unit_id)
                                .map((opt, idx) => (
                                  <option key={idx} value={opt.unit_id}>
                                    {opt.name}
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <input
                              value={unitValue}
                              readOnly
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
                if (renderFields.length === 0) return null;
                return (
                  <div
                    key={entry.ua_id}
                    className="space-y-3 border border-gray-100 rounded-lg p-4 bg-white shadow-xs"
                  >
                    {renderFields}

                    <div className="flex justify-end">
                      {isEditing ? (
                        <button
                          className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 px-3 py-1 rounded-md hover:bg-green-50"
                          onClick={() => handleUpdateItem(entry)}
                        >
                          <SquareCheck className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-50"
                          onClick={() => {
                            setEditingItemId(entry.ua_id);
                            const ev: Record<string, string> = {};
                            for (let i = 1; i <= 6; i++) {
                              ev[`value${i}`] = String(entry[`value${i}` as keyof MWBEntry] ?? "");
                            }
                            setEditedValues(ev);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span>Edit</span>
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