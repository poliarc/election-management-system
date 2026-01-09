import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useGetResultsByBoothQuery } from "../../store/api/resultAnalysisApi";

export default function Form20() {
  const { levelId } = useParams<{ levelId: string }>();
  const [boothInfo, setBoothInfo] = useState({
    boothName: "",
    assemblyName: "",
    districtName: "",
    stateName: "",
  });

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  useEffect(() => {
    if (selectedAssignment) {
      setBoothInfo({
        boothName: selectedAssignment.levelName || selectedAssignment.displayName || "",
        assemblyName: selectedAssignment.parentLevelName || "",
        districtName: (selectedAssignment as any).districtName || "",
        stateName: (selectedAssignment as any).stateName || "",
      });
    }
  }, [selectedAssignment]);

  // Get the correct booth ID - use parentId for booth level users
  // because result analysis data is uploaded for the parent booth from Assembly level
  const boothId = selectedAssignment?.parentId || Number(levelId);

  // Fetch result analysis data for this booth using parentId as boothId
  const {
    data: resultData = [],
    isLoading,
    error,
    refetch,
  } = useGetResultsByBoothQuery(boothId, {
    skip: !boothId || isNaN(boothId),
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
        <div className="bg-gradient-to-r from-green-600 to-Green-700 rounded-xl shadow-lg p-6 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold"> Result Analysis</h1>
             
              {boothInfo.districtName && (
                <p className="text-orange-100 text-sm">
                  District: {boothInfo.districtName} | State: {boothInfo.stateName}
                </p>
              )}
            </div>
           
          </div>
        </div>

        {/* Results Content */}
        {resultData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
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
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No Form 20 Data Available</h3>
              <p className="mt-2 text-gray-500">
                No result analysis data has been uploaded for this booth yet.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Data is uploaded from the Assembly level booth management system.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {resultData.map((result, index) => (
              <div key={result.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Result Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Result Entry {index + 1}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Party: {result.partyName || "Unknown"} | Booth: {result.boothNo}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Uploaded: {new Date(result.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Vote Summary */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {result.validVotes.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-green-700 mt-1">Valid Votes</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {result.rejectedVotes.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-red-700 mt-1">Rejected Votes</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.notaVotes.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-blue-700 mt-1">NOTA Votes</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {result.totalVotes.toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-purple-700 mt-1">Total Votes</div>
                    </div>
                  </div>

                  {/* Candidate Results */}
                  {result.candidateDetails && result.candidateDetails.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Candidate Results</h4>
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
                            {(result.candidateDetails || [])
                              .slice()
                              .sort((a, b) => (b.candidateVotes || 0) - (a.candidateVotes || 0))
                              .map((candidate, candidateIndex) => {
                                const percentage = result.validVotes > 0 
                                  ? ((candidate.candidateVotes || 0) / result.validVotes * 100).toFixed(2)
                                  : "0.00";
                                
                                return (
                                  <tr key={candidateIndex} className={candidateIndex === 0 ? "bg-green-50" : ""}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {candidateIndex === 0 && (
                                          <svg
                                            className="w-5 h-5 text-yellow-500 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                          </svg>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">
                                          #{candidateIndex + 1}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {candidate.candidateName || "Unknown"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {candidate.candidateParty || "Independent"}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {(candidate.candidateVotes || 0).toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <div className="text-sm font-medium text-gray-900">
                                        {percentage}%
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  {result.fileName && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Source File: {result.fileName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}