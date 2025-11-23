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
        <Card className="rounded-[6px] border border-[rgba(255,255,255,0.1)] shadow-sm bg-[#1D1D1D]">
            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">Nome</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ? String(field.value) : ""}
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">MCC</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">CNAE</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
                                            />
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">Fator de risco de antecipação CP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                type="number"
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
                                            />
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">Fator de risco de antecipação CNP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                type="number"
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
                                            />
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">Período de espera CP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                type="number"
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
                                            />
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
                                        <FormLabel className="text-sm text-[#5C5C5C] font-normal">Período de espera CNP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                type="number"
                                                className="h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
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
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 border border-[rgba(255,255,255,0.1)] p-4 rounded-[6px] bg-[#212121]">
                                        <FormControl>
                                            <Checkbox
                                                onCheckedChange={field.onChange}
                                                checked={field.value ?? undefined}
                                                value={field.value?.toString()}
                                                className="rounded-[6px]"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="cursor-pointer text-sm text-[#5C5C5C] font-normal">
                                                Ativo
                                            </FormLabel>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.1)]">
                            <Button type="submit" className="h-[42px] bg-[#212121] border border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0] rounded-[6px] px-4 py-2">
                                Salvar
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
