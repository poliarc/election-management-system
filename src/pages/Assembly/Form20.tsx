import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useGetResultsByAssemblyQuery } from "../../store/api/resultAnalysisApi";

interface ConsolidatedCandidate {
  candidateName: string;
  candidateParty: string;
  totalVotes: number;
  boothsWon: number;
  percentage: number;
}

interface ConsolidatedResult {
  totalValidVotes: number;
  totalRejectedVotes: number;
  totalNotaVotes: number;
  totalVotes: number;
  totalBooths: number;
  candidates: ConsolidatedCandidate[];
  winner: ConsolidatedCandidate | null;
}

interface BoothResult {
  boothId: number;
  boothNo: string;
  validVotes: number;
  rejectedVotes: number;
  notaVotes: number;
  totalVotes: number;
  candidates: Array<{
    candidateName: string;
    candidateParty: string;
    candidateVotes: number;
    position?: number;
  }>;
  winner: {
    candidateName: string;
    candidateParty: string;
    candidateVotes: number;
  } | null;
}

export default function AssemblyForm20() {
  const [assemblyInfo, setAssemblyInfo] = useState({
    assemblyName: "",
    districtName: "",
    stateName: "",
  });
  const [selectedBooth, setSelectedBooth] = useState<BoothResult | null>(null);
  const [showBoothModal, setShowBoothModal] = useState(false);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  useEffect(() => {
    if (selectedAssignment) {
      setAssemblyInfo({
        assemblyName: selectedAssignment.levelName || selectedAssignment.displayName || "",
        districtName: selectedAssignment.parentLevelName || "",
        stateName: (selectedAssignment as any).stateName || "",
      });
    }
  }, [selectedAssignment]);

  // Get the assembly ID from selectedAssignment
  const assemblyId = selectedAssignment?.level_id || selectedAssignment?.afterAssemblyData_id || selectedAssignment?.stateMasterData_id || 0;

  // Fetch result analysis data for this assembly
  const {
    data: resultData = [],
    isLoading,
    error,
    refetch,
  } = useGetResultsByAssemblyQuery(assemblyId, {
    skip: !assemblyId || assemblyId === 0,
  });

  // Calculate consolidated results from all booths
  const consolidatedResults: ConsolidatedResult = useMemo(() => {
    if (!resultData || resultData.length === 0) {
      return {
        totalValidVotes: 0,
        totalRejectedVotes: 0,
        totalNotaVotes: 0,
        totalVotes: 0,
        totalBooths: 0,
        candidates: [],
        winner: null,
      };
    }

    // Group by booth to get unique booths
    const boothsMap = new Map();
    resultData.forEach(result => {
      const boothKey = `${result.boothId}-${result.boothNo}`;
      if (!boothsMap.has(boothKey)) {
        boothsMap.set(boothKey, []);
      }
      boothsMap.get(boothKey).push(result);
    });

    // Calculate totals
    let totalValidVotes = 0;
    let totalRejectedVotes = 0;
    let totalNotaVotes = 0;
    let totalVotes = 0;

    // Consolidate candidates across all booths
    const candidatesMap = new Map<string, ConsolidatedCandidate>();

    boothsMap.forEach((boothResults) => {
      // For each booth, take the latest result (in case of multiple uploads)
      const latestResult = boothResults.sort((a: any, b: any) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];

      // Add to totals
      totalValidVotes += latestResult.validVotes;
      totalRejectedVotes += latestResult.rejectedVotes;
      totalNotaVotes += latestResult.notaVotes;
      totalVotes += latestResult.totalVotes;

      // Process candidates
      if (latestResult.candidateDetails) {
        // Find booth winner
        const sortedCandidates = [...latestResult.candidateDetails]
          .sort((a, b) => (b.candidateVotes || 0) - (a.candidateVotes || 0));
        const boothWinner = sortedCandidates[0];

        latestResult.candidateDetails.forEach((candidate: any) => {
          const key = `${candidate.candidateName}-${candidate.candidateParty}`;
          
          if (candidatesMap.has(key)) {
            const existing = candidatesMap.get(key)!;
            existing.totalVotes += candidate.candidateVotes || 0;
            if (boothWinner && candidate.candidateName === boothWinner.candidateName) {
              existing.boothsWon += 1;
            }
          } else {
            candidatesMap.set(key, {
              candidateName: candidate.candidateName,
              candidateParty: candidate.candidateParty,
              totalVotes: candidate.candidateVotes || 0,
              boothsWon: (boothWinner && candidate.candidateName === boothWinner.candidateName) ? 1 : 0,
              percentage: 0, // Will calculate later
            });
          }
        });
      }
    });

    // Convert to array and calculate percentages
    const candidates = Array.from(candidatesMap.values())
      .map(candidate => ({
        ...candidate,
        percentage: totalValidVotes > 0 ? (candidate.totalVotes / totalValidVotes * 100) : 0,
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes);

    const winner = candidates.length > 0 ? candidates[0] : null;

    return {
      totalValidVotes,
      totalRejectedVotes,
      totalNotaVotes,
      totalVotes,
      totalBooths: boothsMap.size,
      candidates,
      winner,
    };
  }, [resultData]);

  // Calculate booth-wise results for detailed view
  const boothWiseResults: BoothResult[] = useMemo(() => {
    if (!resultData || resultData.length === 0) {
      return [];
    }

    // Group by booth to get unique booths
    const boothsMap = new Map();
    resultData.forEach(result => {
      const boothKey = `${result.boothId}-${result.boothNo}`;
      if (!boothsMap.has(boothKey)) {
        boothsMap.set(boothKey, []);
      }
      boothsMap.get(boothKey).push(result);
    });

    const boothResults: BoothResult[] = [];

    boothsMap.forEach((boothResults_raw) => {
      // For each booth, take the latest result (in case of multiple uploads)
      const latestResult = boothResults_raw.sort((a: any, b: any) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0];

      if (latestResult.candidateDetails && latestResult.candidateDetails.length > 0) {
        // Sort candidates by votes to find winner
        const sortedCandidates = [...latestResult.candidateDetails]
          .sort((a, b) => (b.candidateVotes || 0) - (a.candidateVotes || 0));

        const boothResult: BoothResult = {
          boothId: latestResult.boothId,
          boothNo: latestResult.boothNo,
          validVotes: latestResult.validVotes,
          rejectedVotes: latestResult.rejectedVotes,
          notaVotes: latestResult.notaVotes,
          totalVotes: latestResult.totalVotes,
          candidates: sortedCandidates.map((candidate, index) => ({
            candidateName: candidate.candidateName,
            candidateParty: candidate.candidateParty,
            candidateVotes: candidate.candidateVotes || 0,
            position: index + 1,
          })),
          winner: sortedCandidates[0] ? {
            candidateName: sortedCandidates[0].candidateName,
            candidateParty: sortedCandidates[0].candidateParty,
            candidateVotes: sortedCandidates[0].candidateVotes || 0,
          } : null,
        };

        boothResults.push(boothResult);
      }
    });

    // Sort booths by booth number
    return boothResults.sort((a, b) => a.boothNo.localeCompare(b.boothNo));
  }, [resultData]);

  const handleBoothClick = (booth: BoothResult) => {
    setSelectedBooth(booth);
    setShowBoothModal(true);
  };

  const closeBoothModal = () => {
    setShowBoothModal(false);
    setSelectedBooth(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading Form 20 data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="mt-2 text-red-600 font-medium">Error loading Form 20 data</p>
            <button
              onClick={handleRefresh}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Assembly Result Analysis</h1>
              <p className="text-indigo-100 text-sm mt-2">
                Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
              </p>
              {assemblyInfo.stateName && (
                <p className="text-indigo-100 text-sm">
                  State: {assemblyInfo.stateName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{consolidatedResults.totalBooths}</div>
                <div className="text-indigo-100 text-sm">Total Booths</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{consolidatedResults.totalVotes.toLocaleString()}</div>
                <div className="text-indigo-100 text-sm">Total Votes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Content */}
        {resultData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">No Form 20 Data Available</h3>
              <p className="mt-2 text-gray-500">
                No result analysis data has been uploaded for this assembly yet.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Upload data using the Result Analysis feature in booth management.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Assembly Consolidated Results */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-green-900">🏆 Assembly Result Summary</h2>
                    <p className="text-green-700 text-sm mt-1">
                      Consolidated results from {consolidatedResults.totalBooths} booths
                    </p>
                  </div>
                  {consolidatedResults.winner && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-900">Winner</div>
                      <div className="text-green-800 font-semibold">
                        {consolidatedResults.winner.candidateName}
                      </div>
                      <div className="text-green-700 text-sm">
                        {consolidatedResults.winner.candidateParty}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3">
                {/* Overall Vote Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-1">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {consolidatedResults.totalValidVotes.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-green-700 mt-1">Total Valid Votes</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {consolidatedResults.totalRejectedVotes.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-red-700 mt-1">Total Rejected</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {consolidatedResults.totalNotaVotes.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-blue-700 mt-1">Total NOTA</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {consolidatedResults.totalVotes.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-purple-700 mt-1">Grand Total</div>
                  </div>
                </div>

                {/* Consolidated Candidate Results */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Final Assembly Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Candidate Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Party
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Votes
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booths Won
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {consolidatedResults.candidates.map((candidate, index) => (
                          <tr key={`${candidate.candidateName}-${candidate.candidateParty}`} 
                              className={index === 0 ? "bg-green-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 && (
                                  <svg
                                    className="w-6 h-6 text-yellow-500 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                                <span className="text-lg font-bold text-gray-900">
                                  {index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">
                                {candidate.candidateName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {candidate.candidateParty}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {candidate.totalVotes.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {candidate.percentage.toFixed(2)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {candidate.boothsWon} / {consolidatedResults.totalBooths}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Booth-wise Results */}
            {boothWiseResults.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                  <h2 className="text-xl font-bold text-blue-900">📊 Booth-wise Results</h2>
                  <p className="text-blue-700 text-sm mt-1">
                    Click on any booth to view detailed results
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {boothWiseResults.map((booth) => (
                      <div
                        key={`${booth.boothId}-${booth.boothNo}`}
                        onClick={() => handleBoothClick(booth)}
                        className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all duration-200 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900">Booth {booth.boothNo}</h3>
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        
                        {booth.winner && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-600 mb-1">Winner:</div>
                            <div className="font-semibold text-green-700 text-sm">
                              {booth.winner.candidateName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booth.winner.candidateParty} - {booth.winner.candidateVotes} votes
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-100 rounded p-2 text-center">
                            <div className="font-bold text-green-700">{booth.validVotes}</div>
                            <div className="text-green-600">Valid</div>
                          </div>
                          <div className="bg-red-100 rounded p-2 text-center">
                            <div className="font-bold text-red-700">{booth.rejectedVotes}</div>
                            <div className="text-red-600">Rejected</div>
                          </div>
                        </div>

                        <div className="mt-2 text-center">
                          <div className="text-sm font-bold text-gray-900">
                            Total: {booth.totalVotes}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booth Detail Modal */}
        {showBoothModal && selectedBooth && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Booth {selectedBooth.boothNo} - Detailed Results</h2>
                    <p className="text-indigo-100 text-sm mt-1">
                      Complete voting breakdown for this booth
                    </p>
                  </div>
                  <button
                    onClick={closeBoothModal}
                    className="text-white hover:text-indigo-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Vote Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedBooth.validVotes}
                    </div>
                    <div className="text-sm font-medium text-green-700 mt-1">Valid Votes</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {selectedBooth.rejectedVotes}
                    </div>
                    <div className="text-sm font-medium text-red-700 mt-1">Rejected</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedBooth.notaVotes}
                    </div>
                    <div className="text-sm font-medium text-blue-700 mt-1">NOTA</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedBooth.totalVotes}
                    </div>
                    <div className="text-sm font-medium text-purple-700 mt-1">Total</div>
                  </div>
                </div>

                {/* Winner Highlight */}
                {selectedBooth.winner && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 mb-6 border border-green-200">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <div>
                        <div className="text-lg font-bold text-green-900">Booth Winner</div>
                        <div className="text-green-800 font-semibold">
                          {selectedBooth.winner.candidateName} ({selectedBooth.winner.candidateParty})
                        </div>
                        <div className="text-green-700 text-sm">
                          {selectedBooth.winner.candidateVotes} votes ({((selectedBooth.winner.candidateVotes / selectedBooth.validVotes) * 100).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Results Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate-wise Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Candidate Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Party
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Votes
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedBooth.candidates.map((candidate, index) => (
                          <tr key={`${candidate.candidateName}-${candidate.candidateParty}`} 
                              className={index === 0 ? "bg-green-50" : ""}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 && (
                                  <svg
                                    className="w-5 h-5 text-yellow-500 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                                <span className="font-bold text-gray-900">
                                  #{index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-bold text-gray-900">
                                {candidate.candidateName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {candidate.candidateParty}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-gray-900">
                                {candidate.candidateVotes.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-gray-900">
                                {selectedBooth.validVotes > 0 ? ((candidate.candidateVotes / selectedBooth.validVotes) * 100).toFixed(2) : 0}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeBoothModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}