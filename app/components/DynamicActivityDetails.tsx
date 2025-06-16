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
  unit_id: number;
  name: string;
  Selected?: boolean;
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
};

export default function DynamicActivityDetails({ userId, collectiveId, activityItems }: Props) {
  const [dataMap, setDataMap] = useState<Record<number, MWBEntry[]>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [templateMap, setTemplateMap] = useState<Record<number, any>>({});

  const fetchAll = async () => {
    setLoading(true);
    const result: Record<number, MWBEntry[]> = {};

    for (const item of activityItems) {
      try {
        const res = await fetch(`${API_BASE_URL}/generic/get-it/${userId}/${item.a_id}/${collectiveId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const json = await res.json();
        result[item.a_id] = json || [];
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
        cat_qty_id3: item.cat_qty_id3?.find((u) => u?.Selected)?.unit_id ?? "None",
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

  useEffect(() => {
    if (!userId || !collectiveId || !activityItems?.length) return;
    fetchAll();
  }, [userId, collectiveId, activityItems]);

  if (loading) return <div className="text-sm text-gray-400">Loading activity details...</div>;

  return (
    <div className="space-y-6">
      {activityItems.map((item) => {
        const itemData = Array.isArray(dataMap[item.a_id]) ? dataMap[item.a_id] : [];
        if (itemData.length === 0) return null;

        return (
          <div key={item.a_id}>
            <h3 className="text-md font-semibold text-gray-700 mb-2">{item.name}</h3>
            <div className="space-y-2">
              {itemData.map((entry) => {
                const isEditing = editingItemId === entry.ua_id;

                const renderFields = [1, 2, 3, 4, 5, 6].flatMap((i) => {
                  const value = entry[`value${i}` as keyof MWBEntry];
                  const unitList = entry[`cat_qty_id${i}` as keyof MWBEntry];
                  const unit =
                    Array.isArray(unitList) && unitList.find((u: any) => u?.Selected)?.name;

                  if (!value && !unit) return [];

                  return (
                    <div key={`val${i}`} className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">
                          {(
                            templateMap[item.a_id]?.[`item_id${i}`]?.[0]?.item_description ||
                            templateMap[item.a_id]?.[`item_id${i}`]?.[0]?.item_name ||
                            `Field ${i}`
                          )
                            .replace(/^add\s+/i, "") // remove "add " prefix
                            .replace(/\bbased on.*$/i, "") // remove "based on ..." suffix
                            .trim()}
                        </label>
                        {isEditing ? (
                          <input
                            value={editedValues[`value${i}`] ?? String(value ?? "")}
                            onChange={(e) =>
                              setEditedValues((prev) => ({ ...prev, [`value${i}`]: e.target.value }))
                            }
                            className="border border-blue-400 rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <input
                            value={String(value ?? "")}
                            readOnly
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        )}
                      </div>

                      {unit && (
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-500 mb-1">Unit</label>
                          <input
                            value={unit}
                            readOnly
                            className="border border-gray-300 rounded px-2 py-1 text-sm bg-gray-100"
                          />
                        </div>
                      )}
                    </div>

                  );
                });

                return (
                  <div
                    key={entry.ua_id}
                    className="grid gap-2 items-start text-sm border rounded p-3 bg-white shadow-sm"
                  >
                    {renderFields}

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
