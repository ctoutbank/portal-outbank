"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CategoriesSchema, schemaCategories } from "../schema/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    insertCategoryFormAction,
    updateCategoryFormAction,
} from "../_actions/categories-formActions";
import {getFeeDetailById, FeeDetail, CategoryDetail} from "../server/category";
import { toast } from "sonner";

interface CategoriesProps {
    categories: CategoriesSchema;
}

export default function Categoriesform({ categories }: CategoriesProps) {
    const router = useRouter();
    const form = useForm<CategoriesSchema>({
        resolver: zodResolver(schemaCategories),
        defaultValues: categories,
    });

    const [, setFeeDetail] = useState<FeeDetail | null>(null);

    useEffect(() => {
        console.log("chamou useEffect")
        async function fetchFeeDetail() {
            if (categories?.id && categories?.idSolicitationFee !== null) {
                const data = await getFeeDetailById(Number(categories.idSolicitationFee));
                console.log(" feeDetail retornado:", data);
                setFeeDetail(data);
            }
        }
        fetchFeeDetail();
    }, [categories?.id, categories?.idSolicitationFee]);

   
    const onSubmit = async (data: CategoriesSchema) => {
        function mapSchemaToCategoryDetail(data: CategoriesSchema): CategoryDetail {
            return {
                id: data.id,
                slug: data.slug ?? "",
                name: data.name ?? "",
                active: data.active ?? true,
                dtinsert: data.dtinsert ?? new Date().toISOString(),
                dtupdate: new Date().toISOString(),
                mcc: data.mcc ?? "",
                cnae: data.cnae ?? "",
                anticipationRiskFactorCp: data.anticipation_risk_factor_cp ?? 0,
                anticipationRiskFactorCnp: data.anticipation_risk_factor_cnp ?? 0,
                waitingPeriodCp: data.waiting_period_cp ?? 0,
                waitingPeriodCnp: data.waiting_period_cnp ?? 0,
                idSolicitationFee: data.idSolicitationFee ?? null,
            };
        }

        try {
            toast.loading("Salvando categoria...");
            if (data?.id) {
                const categoryDetail = mapSchemaToCategoryDetail(data);
                await updateCategoryFormAction(categoryDetail);
                toast.success("Categoria atualizada com sucesso!");
                router.refresh();
            } else {
                const newId = await insertCategoryFormAction(data);
                toast.success("Categoria criada com sucesso!");
                router.push(`/categories/${newId}`);
            }
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
            toast.error("Erro ao salvar categoria. Tente novamente.");
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div id="main">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ? String(field.value) : ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="mt-2">
                                        <FormLabel className="block mb-1 mt-3">Ativo</FormLabel>
                                        <FormControl>
                                            <Checkbox
                                                onCheckedChange={field.onChange}
                                                checked={field.value ?? undefined}
                                                value={field.value?.toString()}
                                                className="w-4"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="mcc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">MCC</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="mb-2"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cnae"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">CNAE</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="anticipation_risk_factor_cp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">Fator de risco de antecipação CP</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="anticipation_risk_factor_cnp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">Fator de risco de antecipação CNP</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="waiting_period_cp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">Período de espera CP</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="waiting_period_cnp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mt-2">Período de espera CNP</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {categories?.id && (
                                <div className="mt-6">
                                </div>
                            )}

                            <div className="flex justify-end mt-4">
                                <Button type="submit">Salvar</Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
