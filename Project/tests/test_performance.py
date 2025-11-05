import pytest
import time
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from Mood2FoodRecSys.RecSysFunctions import (
    compute_time_weights, compute_mood_distribution,
    get_user_profile_and_recent_tracks, analyze_mood_with_groq
)


def test_compute_time_weights_performance():
    """Test performance of time weight computation with large datasets"""
    # Test with increasing data sizes
    sizes = [10, 100, 1000, 5000]
    
    for size in sizes:
        items = [{"index": i, "time_stamp": 1000 + i} for i in range(size)]
        
        start_time = time.time()
        weights = compute_time_weights(items)
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        assert execution_time < 1.0  # Less than 1 second
        assert len(weights) == size
        assert abs(sum(weights) - 1.0) < 0.001  # Weights should sum to 1


def test_compute_mood_distribution_performance():
    """Test performance of mood distribution computation"""
    import numpy as np
    
    # Large dataset
    size = 10000
    response_json = [
        {"mood": ["happy", "energetic", "excited", "joyful", "upbeat"]}
        for _ in range(size)
    ]
    weights = np.ones(size) / size
    
    start_time = time.time()
    result = compute_mood_distribution(response_json, weights)
    end_time = time.time()
    
    execution_time = end_time - start_time
    
    assert execution_time < 2.0  # Should complete within 2 seconds
    assert len(result) == 5  # 5 unique moods
    assert all(isinstance(mood_weight, tuple) for mood_weight in result)


@pytest.mark.asyncio
async def test_concurrent_api_calls_performance():
    """Test performance under concurrent load"""
    
    async def mock_api_call():
        # Simulate API processing time
        await asyncio.sleep(0.1)
        return {"result": "success"}
    
    # Test different concurrency levels
    concurrency_levels = [1, 5, 10, 20, 50]
    
    for concurrency in concurrency_levels:
        start_time = time.time()
        
        tasks = [mock_api_call() for _ in range(concurrency)]
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # With proper async handling, should scale well
        expected_time = 0.1 + (concurrency * 0.01)  # Small overhead per task
        assert execution_time < expected_time * 2  # Allow 2x margin
        assert len(results) == concurrency


@pytest.mark.asyncio
async def test_memory_usage_under_load():
    """Test memory usage patterns under load"""
    import gc
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss
    
    # Simulate processing large amounts of data
    large_datasets = []
    
    for i in range(100):
        # Create and process large dataset
        large_data = {
            "tracks": [{"index": j, "track_name": f"track_{j}", "time_stamp": 1000 + j} for j in range(1000)],
            "moods": [{"mood": ["happy", "energetic"]} for _ in range(1000)],
            "foods": [{"name": f"food_{j}", "tags": ["tag1", "tag2"]} for j in range(1000)]
        }
        
        # Process the data (simulate computation)
        weights = compute_time_weights(large_data["tracks"])
        mood_dist = compute_mood_distribution(large_data["moods"], weights)
        
        # Store reference to prevent immediate garbage collection
        large_datasets.append((weights, mood_dist))
        
        # Check memory every 10 iterations
        if i % 10 == 0:
            current_memory = process.memory_info().rss
            memory_growth = current_memory - initial_memory
            
            # Memory growth should be reasonable (less than 100MB)
            assert memory_growth < 100 * 1024 * 1024
    
    # Clean up and verify memory is released
    large_datasets.clear()
    gc.collect()
    
    final_memory = process.memory_info().rss
    memory_after_cleanup = final_memory - initial_memory
    
    # Memory should be mostly released after cleanup
    assert memory_after_cleanup < 50 * 1024 * 1024  # Less than 50MB growth


def test_algorithm_complexity():
    """Test algorithmic complexity of core functions"""
    
    # Test time complexity of compute_time_weights
    sizes = [100, 500, 1000, 2000]
    times = []
    
    for size in sizes:
        items = [{"index": i, "time_stamp": 1000 + i} for i in range(size)]
        
        start_time = time.perf_counter()
        for _ in range(10):  # Run multiple times for accuracy
            compute_time_weights(items)
        end_time = time.perf_counter()
        
        avg_time = (end_time - start_time) / 10
        times.append(avg_time)
    
    # Check that time complexity is reasonable (should be roughly linear)
    for i in range(1, len(times)):
        ratio = times[i] / times[i-1]
        size_ratio = sizes[i] / sizes[i-1]
        
        # Time should not grow faster than O(n log n)
        assert ratio < size_ratio * 2


@pytest.mark.asyncio
async def test_database_query_performance():
    """Test database query performance simulation"""
    
    async def simulate_db_query(query_size):
        # Simulate database query time based on result size
        base_time = 0.01  # 10ms base time
        size_factor = query_size * 0.0001  # Additional time per record
        await asyncio.sleep(base_time + size_factor)
        
        return [{"id": i, "data": f"record_{i}"} for i in range(query_size)]
    
    # Test different query sizes
    query_sizes = [10, 100, 1000, 5000]
    
    for size in query_sizes:
        start_time = time.time()
        result = await simulate_db_query(size)
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        # Verify performance scales reasonably
        expected_max_time = 0.01 + (size * 0.0001) + 0.1  # Add 100ms buffer
        assert execution_time < expected_max_time
        assert len(result) == size


@pytest.mark.asyncio
async def test_api_timeout_handling():
    """Test handling of API timeouts under load"""
    
    async def slow_api_call(delay):
        await asyncio.sleep(delay)
        return {"status": "success"}
    
    # Test with various timeout scenarios
    timeout_scenarios = [
        (0.1, False),  # Fast call, should succeed
        (0.5, False),  # Medium call, should succeed
        (2.0, True),   # Slow call, might timeout
        (5.0, True),   # Very slow call, should timeout
    ]
    
    for delay, should_timeout in timeout_scenarios:
        try:
            result = await asyncio.wait_for(slow_api_call(delay), timeout=1.0)
            assert not should_timeout, f"Expected timeout for delay {delay}"
            assert result["status"] == "success"
        except asyncio.TimeoutError:
            assert should_timeout, f"Unexpected timeout for delay {delay}"


def test_data_structure_efficiency():
    """Test efficiency of data structures used"""
    import sys
    
    # Test memory efficiency of different data structures
    
    # List vs tuple for immutable data
    list_data = [i for i in range(10000)]
    tuple_data = tuple(i for i in range(10000))
    
    list_size = sys.getsizeof(list_data)
    tuple_size = sys.getsizeof(tuple_data)
    
    # Tuple should be more memory efficient
    assert tuple_size <= list_size
    
    # Dict vs list for lookups
    dict_data = {f"key_{i}": i for i in range(1000)}
    list_data = [(f"key_{i}", i) for i in range(1000)]
    
    # Test lookup performance
    start_time = time.perf_counter()
    for _ in range(1000):
        _ = dict_data.get("key_500")
    dict_time = time.perf_counter() - start_time
    
    start_time = time.perf_counter()
    for _ in range(1000):
        _ = next((value for key, value in list_data if key == "key_500"), None)
    list_time = time.perf_counter() - start_time
    
    # Dict lookup should be much faster
    assert dict_time < list_time / 10


@pytest.mark.asyncio
async def test_error_handling_performance():
    """Test that error handling doesn't significantly impact performance"""
    
    async def function_with_error_handling():
        try:
            # Simulate some processing
            await asyncio.sleep(0.01)
            # Simulate potential error condition
            if False:  # Never actually raises
                raise Exception("Test error")
            return "success"
        except Exception:
            return "error"
    
    async def function_without_error_handling():
        # Same processing without try/catch
        await asyncio.sleep(0.01)
        return "success"
    
    # Measure performance difference
    iterations = 100
    
    start_time = time.time()
    for _ in range(iterations):
        await function_with_error_handling()
    with_error_handling_time = time.time() - start_time
    
    start_time = time.time()
    for _ in range(iterations):
        await function_without_error_handling()
    without_error_handling_time = time.time() - start_time
    
    # Error handling overhead should be minimal
    overhead_ratio = with_error_handling_time / without_error_handling_time
    assert overhead_ratio < 1.1  # Less than 10% overhead


def test_json_processing_performance():
    """Test JSON processing performance with large payloads"""
    import json
    
    # Create large JSON payload
    large_payload = {
        "tracks": [
            {
                "index": i,
                "track_name": f"Track {i}",
                "artists": [f"Artist {j}" for j in range(3)],
                "mood_data": {
                    "primary": f"mood_{i % 10}",
                    "secondary": [f"submood_{k}" for k in range(5)]
                }
            }
            for i in range(1000)
        ]
    }
    
    # Test serialization performance
    start_time = time.perf_counter()
    json_string = json.dumps(large_payload)
    serialize_time = time.perf_counter() - start_time
    
    # Test deserialization performance
    start_time = time.perf_counter()
    parsed_payload = json.loads(json_string)
    deserialize_time = time.perf_counter() - start_time
    
    # Should complete within reasonable time
    assert serialize_time < 1.0  # Less than 1 second
    assert deserialize_time < 1.0  # Less than 1 second
    assert len(parsed_payload["tracks"]) == 1000