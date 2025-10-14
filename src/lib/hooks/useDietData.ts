import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { SavedDietItem } from "@/lib/types/diet";

export function useDietData() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // 식단 목록 조회
    const {
        data: dietsData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["saved-diets", userId],
        queryFn: async () => {
            const response = await apiClient.getDiets({ limit: 50 });
            return response.data as { diets: SavedDietItem[] };
        },
        enabled: !!userId,
    });

    // 식단 삭제
    const deleteDietMutation = useMutation<unknown, Error, SavedDietItem>({
        mutationFn: async (dietToDelete: SavedDietItem) => {
            const idsToDelete = dietToDelete.weeklyDiet.map((day) => day.id);
            if (idsToDelete.length === 0) {
                throw new Error("삭제할 식단 항목이 없습니다.");
            }
            return apiClient.deleteDietGroup({ ids: idsToDelete });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saved-diets", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats", userId] });
        },
        onError: (error: unknown) => {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "식단 삭제 중 오류가 발생했습니다.";
            toast.error(errorMessage);
        },
    });

    // 즐겨찾기 토글
    const toggleFavoriteMutation = useMutation({
        mutationFn: async (dietId: number) => {
            const response = await fetch(`/api/diets/${dietId}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: "isFavorite" }),
            });
            if (!response.ok) throw new Error("즐겨찾기 토글 실패");
            return response.json();
        },
        onMutate: async (dietId: number) => {
            // 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ["saved-diets", userId] });

            // 이전 데이터 백업
            const previousDiets = queryClient.getQueryData(["saved-diets", userId]);

            // Optimistic Update
            queryClient.setQueryData(["saved-diets", userId], (old: any) => {
                if (!old?.diets) return old;
                return {
                    ...old,
                    diets: old.diets.map((diet: SavedDietItem) =>
                        diet.firstDietId === dietId
                            ? { ...diet, isFavorite: !diet.isFavorite }
                            : diet
                    ),
                };
            });

            return { previousDiets };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saved-diets", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats", userId] });
            toast.success("즐겨찾기가 업데이트되었습니다.");
        },
        onError: (_error, _variables, context) => {
            // 실패 시 이전 상태로 롤백
            if (context?.previousDiets) {
                queryClient.setQueryData(["saved-diets", userId], context.previousDiets);
            }
            toast.error("즐겨찾기 업데이트에 실패했습니다.");
        },
    });

    const toggleThisWeekMutation = useMutation({
        mutationFn: async (dietId: number) => {
            const response = await fetch(`/api/diets/${dietId}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: "isThisWeek" }),
            });
            if (!response.ok) throw new Error("이번 주 체크 토글 실패");
            return response.json();
        },
        onMutate: async (dietId: number) => {
            // 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ["saved-diets", userId] });

            // 이전 데이터 백업
            const previousDiets = queryClient.getQueryData(["saved-diets", userId]);

            // Optimistic Update
            queryClient.setQueryData(["saved-diets", userId], (old: any) => {
                if (!old?.diets) return old;
                return {
                    ...old,
                    diets: old.diets.map((diet: SavedDietItem) =>
                        diet.firstDietId === dietId
                            ? { ...diet, isThisWeek: !diet.isThisWeek }
                            : diet
                    ),
                };
            });

            return { previousDiets };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["saved-diets", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats", userId] });
            toast.success("이번 주 계획이 업데이트되었습니다.");
        },
        onError: (_error, _variables, context) => {
            // 실패 시 이전 상태로 롤백
            if (context?.previousDiets) {
                queryClient.setQueryData(["saved-diets"], context.previousDiets);
            }
            toast.error("이번 주 계획 업데이트에 실패했습니다.");
        },
    });

    return {
        diets: dietsData?.diets || [],
        isLoading,
        error,
        deleteDiet: deleteDietMutation.mutate,
        toggleFavorite: toggleFavoriteMutation.mutate,
        toggleThisWeek: toggleThisWeekMutation.mutate,
        isDeleting: deleteDietMutation.isPending,
    };
}
