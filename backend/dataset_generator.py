"""
dataset_generator.py - EconoCausal Synthetic Retail Campaign Data Generator
Creates realistic retail marketing datasets with severe confounding bias,
simulating real-world scenarios where standard predictive ML fails because
promotions were historically targeted at already-loyal or high-income customers.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

def generate_retail_dataset(
    n_samples: int = 5000,
    confounding_strength: float = 0.8,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generates an observational retail customer dataset with:
    - Confounders: annual_income_k, loyalty_tier, recency_days, website_visits_30d, historical_discount_usage
    - Customer Segments:
        * Persuadables: Low baseline conversion without discount, high sensitivity (+25-45% uplift with discount)
        * Sure Things: High baseline conversion (75-90%) regardless of discount
        * Lost Causes: Extremely low conversion (<4%) even with discount
        * Sleeping Dogs: Baseline moderate, but discount decreases margin or annoys them (negative net uplift)
    - Confounded Treatment Assignment:
        Marketers historically gave higher discounts to loyal / frequent customers (selection bias).
    - Treatment: discount_tier (0: $0, 10: $10, 20: $20)
    - Outcomes: conversion (0 or 1), purchase_amount ($), true_ite_10, true_ite_20, segment
    """
    rng = np.random.RandomState(random_seed)
    
    customer_ids = [f"CUST-{10000 + i}" for i in range(n_samples)]
    
    # 1. Customer Confounders
    # Annual income in thousands of $ (log-normal, mean ~65k)
    annual_income_k = np.clip(rng.lognormal(mean=4.1, sigma=0.45, size=n_samples), 20, 220).round(1)
    
    # Loyalty Tier: 1 (Bronze), 2 (Silver), 3 (Gold), 4 (Platinum)
    tier_probs = [0.45, 0.30, 0.18, 0.07]
    loyalty_tier = rng.choice([1, 2, 3, 4], size=n_samples, p=tier_probs)
    
    # Recency in days (days since last purchase: 1 to 180)
    recency_days = np.clip(rng.exponential(scale=35, size=n_samples) + 2, 1, 180).astype(int)
    
    # Website visits in last 30 days (Poisson)
    website_visits_30d = np.clip(rng.poisson(lam=4.5 + 1.2 * loyalty_tier, size=n_samples), 0, 35)
    
    # Historical discount usage rate (0.0 to 1.0)
    historical_discount_usage = np.clip(
        0.25 + 0.15 * (loyalty_tier - 1) + 0.002 * (80 - annual_income_k) + rng.normal(0, 0.12, size=n_samples),
        0.02, 0.98
    ).round(3)
    
    # Mobile app user flag
    mobile_app_user = (rng.rand(n_samples) < (0.35 + 0.12 * loyalty_tier)).astype(int)
    
    # 2. Latent Customer Segment Assignment based on behavioral characteristics
    # Price sensitivity is higher for middle/lower income and frequent discount users
    price_sensitivity = np.clip(
        0.55 + 0.35 * historical_discount_usage - 0.003 * annual_income_k + rng.normal(0, 0.15, size=n_samples),
        0.05, 0.95
    )
    
    # Baseline propensity to buy without any discount
    # Loyal & recent & high-income customers buy anyway
    base_logits = (
        -1.8
        + 0.75 * loyalty_tier
        - 0.025 * recency_days
        + 0.08 * website_visits_30d
        + 0.012 * annual_income_k
        - 0.5 * price_sensitivity
    )
    baseline_conv_prob = 1.0 / (1.0 + np.exp(-base_logits))
    baseline_conv_prob = np.clip(baseline_conv_prob, 0.01, 0.98)
    
    # Determine segment
    # - Sure Things: baseline conversion > 0.62
    # - Lost Causes: baseline conversion < 0.10 and price_sensitivity < 0.50
    # - Sleeping Dogs: high loyalty & low price sensitivity where discount induces resentment / churn / negative margin
    # - Persuadables: responds strongly to discounts!
    segments = []
    true_ite_10 = np.zeros(n_samples)
    true_ite_20 = np.zeros(n_samples)
    
    for i in range(n_samples):
        b = baseline_conv_prob[i]
        ps = price_sensitivity[i]
        
        if b >= 0.62:
            segments.append("Sure Thing")
            true_ite_10[i] = rng.uniform(0.01, 0.04)
            true_ite_20[i] = rng.uniform(0.02, 0.06)
        elif b < 0.10 and ps < 0.50:
            segments.append("Lost Cause")
            true_ite_10[i] = rng.uniform(0.005, 0.025)
            true_ite_20[i] = rng.uniform(0.01, 0.04)
        elif loyalty_tier[i] == 4 and ps < 0.25 and rng.rand() < 0.4:
            segments.append("Sleeping Dog")
            true_ite_10[i] = -rng.uniform(0.02, 0.08)
            true_ite_20[i] = -rng.uniform(0.04, 0.12)
        else:
            segments.append("Persuadable")
            true_ite_10[i] = np.clip(0.12 + 0.25 * ps + rng.normal(0, 0.03), 0.08, 0.38)
            true_ite_20[i] = np.clip(true_ite_10[i] + 0.10 + 0.12 * ps + rng.normal(0, 0.02), true_ite_10[i] + 0.04, 0.52)
            
    # 3. Observational Treatment Assignment (CONFOUNDING BIAS)
    treatment_logits = (
        -1.5
        + confounding_strength * (
            0.6 * loyalty_tier
            - 0.015 * recency_days
            + 0.06 * website_visits_30d
            + 0.5 * historical_discount_usage
            + 0.008 * annual_income_k
        )
    )
    p_treat = 1.0 / (1.0 + np.exp(-treatment_logits))
    
    treatment_discount = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        r = rng.rand()
        p = p_treat[i]
        if r < (1 - p):
            treatment_discount[i] = 0
        elif r < (1 - p) + p * 0.45:
            treatment_discount[i] = 10
        else:
            treatment_discount[i] = 20
            
    treatment_binary = (treatment_discount > 0).astype(int)
    
    actual_conv_prob = np.zeros(n_samples)
    for i in range(n_samples):
        tier = treatment_discount[i]
        if tier == 0:
            actual_conv_prob[i] = baseline_conv_prob[i]
        elif tier == 10:
            actual_conv_prob[i] = baseline_conv_prob[i] + true_ite_10[i]
        else:
            actual_conv_prob[i] = baseline_conv_prob[i] + true_ite_20[i]
            
    actual_conv_prob = np.clip(actual_conv_prob, 0.005, 0.995)
    conversion = (rng.rand(n_samples) < actual_conv_prob).astype(int)
    
    base_aov = 45.0 + 0.65 * annual_income_k + 15.0 * loyalty_tier + rng.normal(0, 15, size=n_samples)
    base_aov = np.clip(base_aov, 25.0, 350.0).round(2)
    
    revenue = np.where(conversion == 1, np.maximum(base_aov - treatment_discount, 5.0), 0.0).round(2)
    
    tier_names = {1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum"}
    loyalty_tier_name = [tier_names[t] for t in loyalty_tier]
    
    df = pd.DataFrame({
        "customer_id": customer_ids,
        "annual_income_k": annual_income_k,
        "loyalty_tier": loyalty_tier,
        "loyalty_name": loyalty_tier_name,
        "recency_days": recency_days,
        "website_visits_30d": website_visits_30d,
        "historical_discount_usage": historical_discount_usage,
        "mobile_app_user": mobile_app_user,
        "price_sensitivity": price_sensitivity.round(3),
        "treatment_discount": treatment_discount,
        "treatment_binary": treatment_binary,
        "baseline_prob": baseline_conv_prob.round(4),
        "actual_prob": actual_conv_prob.round(4),
        "true_ite_10": true_ite_10.round(4),
        "true_ite_20": true_ite_20.round(4),
        "true_segment": segments,
        "conversion": conversion,
        "purchase_amount": base_aov,
        "revenue": revenue
    })
    
    return df

if __name__ == "__main__":
    df = generate_retail_dataset(5000)
    print(f"Generated dataset with {len(df)} rows.")
    print(df.groupby("true_segment").agg(
        count=("customer_id", "count"),
        mean_baseline=("baseline_prob", "mean"),
        mean_ite_10=("true_ite_10", "mean"),
        mean_ite_20=("true_ite_20", "mean")
    ))
